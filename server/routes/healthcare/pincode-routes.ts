import { Application } from 'express';

interface Appkit {
  lakebase: {
    query(text: string, params?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  };
  server: {
    extend(fn: (app: Application) => void): void;
  };
}

export function setupPincodeRoutes(appkit: Appkit) {
  appkit.server.extend((app) => {
    app.get('/api/pincodes/states', async (_req, res) => {
      try {
        const result = await appkit.lakebase.query(`
          SELECT DISTINCT statename AS state
          FROM public.india_post_pincode_directory
          WHERE statename IS NOT NULL
          ORDER BY statename
        `);
        res.json(result.rows.map((r) => r.state));
      } catch (err) {
        console.error('Failed to fetch states:', err);
        res.status(500).json({ error: 'Failed to fetch states' });
      }
    });

    app.get('/api/pincodes', async (req, res) => {
      try {
        const pincode = (req.query.pincode as string) || '';
        const state = (req.query.state as string) || '';
        const district = (req.query.district as string) || '';
        const search = (req.query.search as string) || '';
        const limit = Math.min(parseInt((req.query.limit as string) || '50', 10), 200);

        if (!pincode && !state && !district && !search) {
          res.json({ rows: [], total: 0 });
          return;
        }

        const conditions: string[] = [];
        const params: unknown[] = [];
        let paramIdx = 1;

        if (pincode) {
          conditions.push(`pincode::text ILIKE $${paramIdx}`);
          params.push(`${pincode}%`);
          paramIdx++;
        }
        if (state) {
          conditions.push(`statename = $${paramIdx}`);
          params.push(state);
          paramIdx++;
        }
        if (district) {
          conditions.push(`district ILIKE $${paramIdx}`);
          params.push(`%${district}%`);
          paramIdx++;
        }
        if (search) {
          conditions.push(
            `(officename ILIKE $${paramIdx} OR district ILIKE $${paramIdx} OR pincode::text ILIKE $${paramIdx})`,
          );
          params.push(`%${search}%`);
          paramIdx++;
        }

        const where = `WHERE ${conditions.join(' AND ')}`;

        const countResult = await appkit.lakebase.query(
          `SELECT COUNT(*) AS total FROM public.india_post_pincode_directory ${where}`,
          params,
        );
        const total = parseInt(String(countResult.rows[0]?.total ?? '0'), 10);

        params.push(limit);
        const dataResult = await appkit.lakebase.query(
          `SELECT
            pincode, officename, officetype, delivery,
            district, statename, circlename, regionname, divisionname,
            latitude, longitude
          FROM public.india_post_pincode_directory
          ${where}
          ORDER BY statename, district, pincode
          LIMIT $${paramIdx}`,
          params,
        );

        res.json({ total, rows: dataResult.rows });
      } catch (err) {
        console.error('Failed to fetch pincodes:', err);
        res.status(500).json({ error: 'Failed to fetch pincode data' });
      }
    });
  });
}
