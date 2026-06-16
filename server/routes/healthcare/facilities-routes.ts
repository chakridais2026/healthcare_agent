import { Application } from 'express';

interface Appkit {
  lakebase: {
    query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  };
  server: {
    extend(fn: (app: Application) => void): void;
  };
}

export function setupFacilitiesRoutes(appkit: Appkit) {
  appkit.server.extend((app) => {
    app.get('/api/facilities/states', async (_req, res) => {
      try {
        const result = await appkit.lakebase.query(`
          SELECT TRIM(address_stateorregion) AS state
          FROM public.facilities
          WHERE address_stateorregion IS NOT NULL
            AND TRIM(address_stateorregion) != ''
            AND LENGTH(TRIM(address_stateorregion)) > 2
            AND TRIM(address_stateorregion) NOT LIKE '%[%'
            AND TRIM(address_stateorregion) NOT LIKE '"%'
          GROUP BY 1
          HAVING COUNT(*) >= 5
          ORDER BY 1
        `);
        res.json(result.rows.map((r) => r.state));
      } catch (err) {
        console.error('Failed to fetch states:', err);
        res.status(500).json({ error: 'Failed to fetch states' });
      }
    });

    app.get('/api/facilities/types', async (_req, res) => {
      try {
        const result = await appkit.lakebase.query(`
          SELECT DISTINCT organization_type AS type
          FROM public.facilities
          WHERE organization_type IS NOT NULL AND organization_type != ''
          ORDER BY organization_type
          LIMIT 50
        `);
        res.json(result.rows.map((r) => r.type));
      } catch (err) {
        console.error('Failed to fetch org types:', err);
        res.status(500).json({ error: 'Failed to fetch organization types' });
      }
    });

    app.get('/api/facilities', async (req, res) => {
      try {
        const search = (req.query.search as string) || '';
        const state = (req.query.state as string) || '';
        const type = (req.query.type as string) || '';
        const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 100);
        const offset = parseInt((req.query.offset as string) || '0', 10);

        const conditions: string[] = [];
        const params: unknown[] = [];
        let paramIdx = 1;

        if (search) {
          conditions.push(`(name ILIKE $${paramIdx} OR address_city ILIKE $${paramIdx})`);
          params.push(`%${search}%`);
          paramIdx++;
        }
        if (state) {
          conditions.push(`TRIM(address_stateorregion) = $${paramIdx}`);
          params.push(state);
          paramIdx++;
        }
        if (type) {
          conditions.push(`organization_type = $${paramIdx}`);
          params.push(type);
          paramIdx++;
        }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countResult = await appkit.lakebase.query(
          `SELECT COUNT(*) AS total FROM public.facilities ${where}`,
          params,
        );
        const total = parseInt(String(countResult.rows[0]?.total ?? '0'), 10);

        params.push(limit, offset);
        const dataResult = await appkit.lakebase.query(
          `SELECT
            row_id, unique_id, name, organization_type, address_city, address_stateorregion,
            address_country, email, officialwebsite, officialphone,
            capacity, numberdoctors, specialties, description,
            latitude, longitude, yearestablished
          FROM public.facilities
          ${where}
          ORDER BY name ASC NULLS LAST
          LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
          params,
        );

        res.json({ total, rows: dataResult.rows });
      } catch (err) {
        console.error('Failed to fetch facilities:', err);
        res.status(500).json({ error: 'Failed to fetch facilities' });
      }
    });

    app.get('/api/facilities/:id', async (req, res) => {
      try {
        const result = await appkit.lakebase.query(
          `SELECT * FROM public.facilities WHERE unique_id = $1 LIMIT 1`,
          [req.params.id],
        );
        if (result.rows.length === 0) {
          res.status(404).json({ error: 'Facility not found' });
          return;
        }
        res.json(result.rows[0]);
      } catch (err) {
        console.error('Failed to fetch facility:', err);
        res.status(500).json({ error: 'Failed to fetch facility' });
      }
    });

    app.get('/api/facilities/stats/summary', async (_req, res) => {
      try {
        const result = await appkit.lakebase.query(`
          SELECT
            COUNT(*) AS total_facilities,
            COUNT(DISTINCT address_stateorregion) AS states_covered,
            COUNT(DISTINCT organization_type) AS org_types,
            COUNT(CASE WHEN acceptsvolunteers = 'true' THEN 1 END) AS accepts_volunteers
          FROM public.facilities
        `);
        res.json(result.rows[0]);
      } catch (err) {
        console.error('Failed to fetch facility stats:', err);
        res.status(500).json({ error: 'Failed to fetch stats' });
      }
    });
  });
}
