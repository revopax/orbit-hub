# ============================================================
# MOTOR 3 — Forecast: Prophet × sectores SCIAN
# ============================================================
import pandas as pd
import numpy as np
from prophet import Prophet
import warnings
warnings.filterwarnings('ignore')
from config import PROPHET_PERIODS, PROPHET_FREQ, SCIAN_MAP

# Sectores agregados a excluir — no tienen código SCIAN
SECTORES_EXCLUIR = {
    'Indicador Global de la Actividad Económica',
    'Actividades primarias',
    'Actividades secundarias',
    'Actividades terciarias',
}



# ── Eventos históricos que distorsionan el IGAE ──────────────────────────
EVENTOS = [
    ('covid',      '2020-03-01', '2021-12-31'),
    ('crisis2008', '2008-09-01', '2009-12-31'),
    ('fobaproa',   '1995-01-01', '1996-12-31'),
    ('mundial2006','2006-06-01', '2006-07-31'),
    ('mundial2010','2010-06-01', '2010-07-31'),
    ('mundial2014','2014-06-01', '2014-07-31'),
    ('mundial2018','2018-06-01', '2018-07-31'),
    ('mundial2022','2022-11-01', '2022-12-31'),
]

def _agregar_regressors(df):
    df = df.copy()
    for nombre, inicio, fin in EVENTOS:
        df[nombre] = ((df['ds'] >= inicio) & (df['ds'] <= fin)).astype(int)
    return df

def entrenar_forecast(df_igae_long: pd.DataFrame) -> pd.DataFrame:
    """
    Entrena un modelo Prophet por sector y genera forecast.
    Input:  df_igae_long con columnas [fecha, sector_igae, valor_indice]
    Output: df_forecast con columnas [sector_igae, fecha, yhat, yhat_lower,
            yhat_upper, z_score, temperatura, es_forecast]
    """
    from zscore_igae import calcular_zscore, temperatura as get_temp

    # Filtrar solo sectores SCIAN reales — excluir agregados
    df_igae_long = df_igae_long[
        ~df_igae_long['sector_igae'].isin(SECTORES_EXCLUIR)
    ].copy()

    sectores = df_igae_long['sector_igae'].unique()
    resultados = []

    print(f"── Entrenando Prophet para {len(sectores)} sectores ──")

    for sector in sectores:
        df_s = (
            df_igae_long[df_igae_long['sector_igae'] == sector]
            [['fecha', 'valor_indice']]
            .rename(columns={'fecha': 'ds', 'valor_indice': 'y'})
            .dropna()
            .sort_values('ds')
        )

        if len(df_s) < 24:
            print(f"  ⚠ {sector}: datos insuficientes ({len(df_s)} meses), saltando")
            continue

        try:
            m = Prophet(
                seasonality_mode='multiplicative',
                yearly_seasonality=True,
                weekly_seasonality=False,
                daily_seasonality=False,
                changepoint_prior_scale=0.05,
            )
            for nombre, _, _ in EVENTOS:
                m.add_regressor(nombre, standardize=False)
            df_s = _agregar_regressors(df_s)
            m.fit(df_s)
            futuro   = m.make_future_dataframe(periods=PROPHET_PERIODS, freq=PROPHET_FREQ)
            futuro   = _agregar_regressors(futuro)
            forecast = m.predict(futuro)

            forecast['sector_igae']  = sector
            forecast['es_forecast']  = forecast['ds'] > df_s['ds'].max()
            forecast['valor_indice'] = np.where(
                forecast['es_forecast'], np.nan, df_s.set_index('ds')['y'].reindex(forecast['ds']).values
            )

            resultados.append(forecast[['ds','sector_igae','yhat','yhat_lower','yhat_upper','es_forecast']])
            print(f"  ✅ {sector}")

        except Exception as e:
            print(f"  ❌ {sector}: {e}")

    df_forecast = pd.concat(resultados, ignore_index=True)
    df_forecast = df_forecast.rename(columns={'ds': 'fecha'})

    # Calcular Z-score sobre yhat
    df_for_z = df_forecast[['fecha','sector_igae','yhat']].rename(columns={'yhat':'valor_indice'})
    df_z     = calcular_zscore(df_for_z)

    df_forecast = df_forecast.merge(
        df_z[['fecha','sector_igae','z_score','temperatura']],
        on=['fecha','sector_igae'], how='left'
    )

    print(f"\n✅ Forecast completo: {len(df_forecast):,} filas, {df_forecast['sector_igae'].nunique()} sectores")
    return df_forecast