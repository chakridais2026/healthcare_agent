import { Application } from 'express';

interface Appkit {
  lakebase: {
    query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  };
  server: {
    extend(fn: (app: Application) => void): void;
  };
}

export function setupHealthIndicatorsRoutes(appkit: Appkit) {
  appkit.server.extend((app) => {
    app.get('/api/health-indicators/states', async (_req, res) => {
      try {
        const result = await appkit.lakebase.query(`
          SELECT DISTINCT TRIM(state_ut) AS state
          FROM public.nfhs_5_district_health_indicators
          WHERE state_ut IS NOT NULL AND TRIM(state_ut) != ''
          ORDER BY 1
        `);
        res.json(result.rows.map((r) => r.state));
      } catch (err) {
        console.error('Failed to fetch states:', err);
        res.status(500).json({ error: 'Failed to fetch states' });
      }
    });

    app.get('/api/health-indicators', async (req, res) => {
      try {
        const state = (req.query.state as string) || '';
        const search = (req.query.search as string) || '';

        const conditions: string[] = [];
        const params: unknown[] = [];
        let paramIdx = 1;

        if (state) {
          conditions.push(`TRIM(state_ut) = $${paramIdx}`);
          params.push(state);
          paramIdx++;
        }
        if (search) {
          conditions.push(`TRIM(district_name) ILIKE $${paramIdx}`);
          params.push(`%${search}%`);
          paramIdx++;
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const result = await appkit.lakebase.query(
          `SELECT
            TRIM(district_name) AS district_name,
            TRIM(state_ut) AS state_ut,
            institutional_birth_5y_pct,
            child_u5_who_are_stunted_height_for_age_18_pct AS child_stunted_pct,
            child_u5_who_are_wasted_weight_for_height_18_pct AS child_wasted_pct,
            child_u5_who_are_underweight_weight_for_age_18_pct AS child_underweight_pct,
            all_w15_49_who_are_anaemic_pct AS women_anaemic_pct,
            child_6_59m_who_are_anaemic_lt_11_0_g_dl_22_pct AS child_anaemic_pct,
            mothers_who_had_at_least_4_anc_visits_lb5y_pct AS anc_4_visits_pct,
            hh_use_improved_sanitation_pct AS improved_sanitation_pct,
            hh_electricity_pct AS electricity_pct,
            women_age_15_49_who_are_literate_pct AS women_literate_pct,
            fp_cm_w15_49_modern_method_pct AS modern_contraceptive_pct,
            households_surveyed
          FROM public.nfhs_5_district_health_indicators
          ${where}
          ORDER BY state_ut ASC NULLS LAST, district_name ASC NULLS LAST`,
          params,
        );
        res.json({ rows: result.rows, total: result.rows.length });
      } catch (err) {
        console.error('Failed to fetch health indicators:', err);
        res.status(500).json({ error: 'Failed to fetch health indicators' });
      }
    });

    app.get('/api/health-indicators/district', async (req, res) => {
      try {
        const district = req.query.district as string;
        const state = req.query.state as string;
        if (!district || !state) {
          res.status(400).json({ error: 'district and state are required' });
          return;
        }
        const result = await appkit.lakebase.query(
          `SELECT * FROM public.nfhs_5_district_health_indicators
           WHERE TRIM(district_name) = $1 AND TRIM(state_ut) = $2 LIMIT 1`,
          [district, state],
        );
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'District not found' });
          return;
        }
        res.json(result.rows[0]);
      } catch (err) {
        console.error('Failed to fetch district:', err);
        res.status(500).json({ error: 'Failed to fetch district data' });
      }
    });
  });
}
