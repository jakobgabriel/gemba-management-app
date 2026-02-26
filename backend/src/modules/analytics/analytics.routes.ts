import { Router, Request, Response } from 'express';
import { query } from '../../db.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { success } from '../../utils/response.js';
import { AppError } from '../../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /dashboard - Aggregate dashboard data
router.get('/dashboard', requireRole(2), async (_req: Request, res: Response) => {
  try {
    // Total issues
    const totalResult = await query('SELECT COUNT(*) AS total FROM gemba.issues');

    // Issues by status
    const byStatusResult = await query(
      `SELECT status, COUNT(*) AS count
       FROM gemba.issues
       GROUP BY status
       ORDER BY status`,
    );

    // Issues by level
    const byLevelResult = await query(
      `SELECT level, COUNT(*) AS count
       FROM gemba.issues
       GROUP BY level
       ORDER BY level`,
    );

    // Recent issues (last 10)
    const recentResult = await query(
      `SELECT i.id, i.title, i.status, i.level, i.priority,
              c.name AS category_name, i.created_at
       FROM gemba.issues i
       LEFT JOIN gemba_config.issue_categories c ON i.category_id = c.id
       ORDER BY i.created_at DESC
       LIMIT 10`,
    );

    // Open issues count
    const openCount = await query(
      `SELECT COUNT(*) AS count FROM gemba.issues WHERE status = 'OPEN'`,
    );

    // Escalated issues count
    const escalatedCount = await query(
      `SELECT COUNT(*) AS count FROM gemba.issues WHERE status = 'ESCALATED'`,
    );

    res.json(success({
      total_issues: parseInt(totalResult.rows[0].total, 10),
      open_issues: parseInt(openCount.rows[0].count, 10),
      escalated_issues: parseInt(escalatedCount.rows[0].count, 10),
      by_status: byStatusResult.rows.map((r) => ({
        status: r.status,
        count: parseInt(r.count, 10),
      })),
      by_level: byLevelResult.rows.map((r) => ({
        level: r.level,
        count: parseInt(r.count, 10),
      })),
      recent_issues: recentResult.rows,
    }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// GET /issues/breakdown - Category breakdown with counts and percentages
router.get('/issues/breakdown', requireRole(2), async (_req: Request, res: Response) => {
  try {
    const totalResult = await query('SELECT COUNT(*) AS total FROM gemba.issues');
    const total = parseInt(totalResult.rows[0].total, 10);

    const breakdownResult = await query(
      `SELECT c.name AS category, COUNT(*) AS count
       FROM gemba.issues i
       LEFT JOIN gemba_config.issue_categories c ON i.category_id = c.id
       GROUP BY c.name
       ORDER BY count DESC`,
    );

    const breakdown = breakdownResult.rows.map((r) => {
      const count = parseInt(r.count, 10);
      return {
        category: r.category || 'Uncategorized',
        count,
        percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
      };
    });

    res.json(success({
      total,
      breakdown,
    }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// GET /issues/resolution-times - Avg/min/max resolution times
router.get('/issues/resolution-times', requireRole(3), async (req: Request, res: Response) => {
  try {
    const { from_date, to_date } = req.query;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (from_date) {
      conditions.push(`r.created_at >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`r.created_at <= $${paramIndex++}`);
      params.push(to_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT
         COUNT(*) AS total_resolved,
         ROUND(AVG(EXTRACT(EPOCH FROM (r.created_at - i.created_at)) / 3600)::numeric, 2) AS avg_hours,
         ROUND(MIN(EXTRACT(EPOCH FROM (r.created_at - i.created_at)) / 3600)::numeric, 2) AS min_hours,
         ROUND(MAX(EXTRACT(EPOCH FROM (r.created_at - i.created_at)) / 3600)::numeric, 2) AS max_hours
       FROM gemba.issue_resolutions r
       JOIN gemba.issues i ON r.issue_id = i.id
       ${whereClause}`,
      params,
    );

    // Breakdown by category
    const byCategoryResult = await query(
      `SELECT
         c.name AS category,
         COUNT(*) AS count,
         ROUND(AVG(EXTRACT(EPOCH FROM (r.created_at - i.created_at)) / 3600)::numeric, 2) AS avg_hours
       FROM gemba.issue_resolutions r
       JOIN gemba.issues i ON r.issue_id = i.id
       LEFT JOIN gemba_config.issue_categories c ON i.category_id = c.id
       ${whereClause}
       GROUP BY c.name
       ORDER BY avg_hours DESC`,
      params,
    );

    const stats = result.rows[0];

    res.json(success({
      total_resolved: parseInt(stats.total_resolved, 10),
      avg_resolution_hours: parseFloat(stats.avg_hours) || 0,
      min_resolution_hours: parseFloat(stats.min_hours) || 0,
      max_resolution_hours: parseFloat(stats.max_hours) || 0,
      by_category: byCategoryResult.rows.map((r) => ({
        category: r.category || 'Uncategorized',
        count: parseInt(r.count, 10),
        avg_hours: parseFloat(r.avg_hours) || 0,
      })),
    }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// GET /production/efficiency - Production efficiency by date range
router.get('/production/efficiency', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { from_date, to_date, workstation_id } = req.query;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (from_date) {
      conditions.push(`pe.entry_date >= $${paramIndex++}`);
      params.push(from_date);
    }
    if (to_date) {
      conditions.push(`pe.entry_date <= $${paramIndex++}`);
      params.push(to_date);
    }
    if (workstation_id) {
      conditions.push(`pe.workstation_id = $${paramIndex++}`);
      params.push(workstation_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Overall efficiency
    const overallResult = await query(
      `SELECT
         SUM(pe.actual) AS total_actual,
         SUM(pe.target) AS total_target,
         CASE WHEN SUM(pe.target) > 0
           THEN ROUND((SUM(pe.actual)::numeric / SUM(pe.target)::numeric) * 100, 2)
           ELSE 0
         END AS efficiency_pct
       FROM gemba.production_entries pe
       ${whereClause}`,
      params,
    );

    // Daily efficiency trend
    const dailyResult = await query(
      `SELECT
         pe.entry_date,
         SUM(pe.actual) AS actual,
         SUM(pe.target) AS target,
         CASE WHEN SUM(pe.target) > 0
           THEN ROUND((SUM(pe.actual)::numeric / SUM(pe.target)::numeric) * 100, 2)
           ELSE 0
         END AS efficiency_pct
       FROM gemba.production_entries pe
       ${whereClause}
       GROUP BY pe.entry_date
       ORDER BY pe.entry_date ASC`,
      params,
    );

    // By workstation
    const byWorkstationResult = await query(
      `SELECT
         w.name AS workstation_name,
         SUM(pe.actual) AS actual,
         SUM(pe.target) AS target,
         CASE WHEN SUM(pe.target) > 0
           THEN ROUND((SUM(pe.actual)::numeric / SUM(pe.target)::numeric) * 100, 2)
           ELSE 0
         END AS efficiency_pct
       FROM gemba.production_entries pe
       LEFT JOIN gemba_config.workstations w ON pe.workstation_id = w.id
       ${whereClause}
       GROUP BY w.name
       ORDER BY efficiency_pct DESC`,
      params,
    );

    const overall = overallResult.rows[0];

    res.json(success({
      overall: {
        total_actual: parseInt(overall.total_actual, 10) || 0,
        total_target: parseInt(overall.total_target, 10) || 0,
        efficiency_pct: parseFloat(overall.efficiency_pct) || 0,
      },
      daily_trend: dailyResult.rows.map((r) => ({
        date: r.entry_date,
        actual: parseInt(r.actual, 10),
        target: parseInt(r.target, 10),
        efficiency_pct: parseFloat(r.efficiency_pct),
      })),
      by_workstation: byWorkstationResult.rows.map((r) => ({
        workstation: r.workstation_name,
        actual: parseInt(r.actual, 10),
        target: parseInt(r.target, 10),
        efficiency_pct: parseFloat(r.efficiency_pct),
      })),
    }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// POST /ai/query - Simple keyword search on issues
router.post('/ai/query', requireRole(2), async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question || typeof question !== 'string') {
      throw new AppError(400, 'VALIDATION_ERROR', 'Question is required');
    }

    // Extract keywords from the question (split, filter stop words, lowercase)
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall',
      'should', 'may', 'might', 'must', 'can', 'could', 'of', 'in', 'to',
      'for', 'with', 'on', 'at', 'from', 'by', 'about', 'as', 'into',
      'through', 'during', 'before', 'after', 'above', 'below', 'between',
      'and', 'or', 'but', 'not', 'no', 'nor', 'so', 'yet', 'both', 'either',
      'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most',
      'other', 'some', 'such', 'than', 'too', 'very', 'just', 'how', 'what',
      'when', 'where', 'which', 'who', 'why', 'this', 'that', 'these', 'those',
      'it', 'its', 'my', 'me', 'we', 'our', 'your', 'their', 'them', 'i',
      'show', 'find', 'get', 'list', 'give', 'tell', 'many', 'much',
    ]);

    const keywords = question
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((word: string) => word.length > 2 && !stopWords.has(word));

    if (keywords.length === 0) {
      res.json(success({
        query: question,
        results: [],
        message: 'No meaningful keywords found in the query',
      }));
      return;
    }

    // Build a search query with scoring based on keyword matches
    const searchConditions = keywords.map((_kw: string, idx: number) => {
      const paramNum = idx + 1;
      return `(CASE WHEN i.title ILIKE $${paramNum} THEN 3 ELSE 0 END + CASE WHEN i.description ILIKE $${paramNum} THEN 1 ELSE 0 END)`;
    });

    const scoreExpression = searchConditions.join(' + ');
    const likeParams = keywords.map((kw: string) => `%${kw}%`);

    // Filter: at least one keyword must match
    const filterConditions = keywords.map((_kw: string, idx: number) => {
      const paramNum = idx + 1;
      return `(i.title ILIKE $${paramNum} OR i.description ILIKE $${paramNum})`;
    });
    const filterExpression = filterConditions.join(' OR ');

    const result = await query(
      `SELECT i.id, i.title, i.description, i.status, i.level, i.priority,
              c.name AS category_name,
              (${scoreExpression}) AS relevance_score
       FROM gemba.issues i
       LEFT JOIN gemba_config.issue_categories c ON i.category_id = c.id
       WHERE ${filterExpression}
       ORDER BY relevance_score DESC, i.created_at DESC
       LIMIT 20`,
      likeParams,
    );

    res.json(success({
      query: question,
      keywords,
      total_results: result.rows.length,
      results: result.rows.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        status: r.status,
        level: r.level,
        priority: r.priority,
        category: r.category_name,
        relevance_score: parseInt(r.relevance_score, 10),
      })),
    }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

// POST /ai/report - Generate summary report
router.post('/ai/report', requireRole(3), async (req: Request, res: Response) => {
  try {
    const { report_type, from_date, to_date } = req.body;

    if (!report_type) {
      throw new AppError(400, 'VALIDATION_ERROR', 'report_type is required (resolution-times, category-breakdown, or escalation-analysis)');
    }

    const validTypes = ['resolution-times', 'category-breakdown', 'escalation-analysis'];
    if (!validTypes.includes(report_type)) {
      throw new AppError(400, 'VALIDATION_ERROR', `report_type must be one of: ${validTypes.join(', ')}`);
    }

    const dateConditions: string[] = [];
    const dateParams: unknown[] = [];
    let paramIndex = 1;

    if (from_date) {
      dateConditions.push(`created_at >= $${paramIndex++}`);
      dateParams.push(from_date);
    }
    if (to_date) {
      dateConditions.push(`created_at <= $${paramIndex++}`);
      dateParams.push(to_date);
    }

    let reportData: Record<string, unknown>;
    let summary: string;

    if (report_type === 'resolution-times') {
      const resDateConditions = dateConditions.map((c) => c.replace('created_at', 'r.created_at'));
      const resWhereClause = resDateConditions.length > 0 ? `WHERE ${resDateConditions.join(' AND ')}` : '';

      const result = await query(
        `SELECT
           COUNT(*) AS total_resolved,
           ROUND(AVG(EXTRACT(EPOCH FROM (r.created_at - i.created_at)) / 3600)::numeric, 2) AS avg_hours,
           ROUND(MIN(EXTRACT(EPOCH FROM (r.created_at - i.created_at)) / 3600)::numeric, 2) AS min_hours,
           ROUND(MAX(EXTRACT(EPOCH FROM (r.created_at - i.created_at)) / 3600)::numeric, 2) AS max_hours
         FROM gemba.issue_resolutions r
         JOIN gemba.issues i ON r.issue_id = i.id
         ${resWhereClause}`,
        dateParams,
      );

      const stats = result.rows[0];
      const avgHours = parseFloat(stats.avg_hours) || 0;
      const totalResolved = parseInt(stats.total_resolved, 10);

      reportData = {
        total_resolved: totalResolved,
        avg_resolution_hours: avgHours,
        min_resolution_hours: parseFloat(stats.min_hours) || 0,
        max_resolution_hours: parseFloat(stats.max_hours) || 0,
      };

      summary = `Resolution Times Report: ${totalResolved} issues resolved with an average resolution time of ${avgHours.toFixed(1)} hours. `;
      if (avgHours > 48) {
        summary += 'Average resolution time exceeds 48 hours, suggesting process improvement opportunities. Consider implementing triage workflows to prioritize critical issues.';
      } else if (avgHours > 24) {
        summary += 'Resolution times are moderate. Focus on reducing outliers to bring down the average further.';
      } else {
        summary += 'Resolution times are within acceptable ranges. Continue monitoring for any degradation.';
      }
    } else if (report_type === 'category-breakdown') {
      const catWhereClause = dateConditions.length > 0
        ? `WHERE ${dateConditions.map((c) => c.replace('created_at', 'i.created_at')).join(' AND ')}`
        : '';

      const totalResult = await query(
        `SELECT COUNT(*) AS total FROM gemba.issues i ${catWhereClause}`,
        dateParams,
      );
      const total = parseInt(totalResult.rows[0].total, 10);

      const breakdownResult = await query(
        `SELECT c.name AS category, COUNT(*) AS count
         FROM gemba.issues i
         LEFT JOIN gemba_config.issue_categories c ON i.category_id = c.id
         ${catWhereClause}
         GROUP BY c.name
         ORDER BY count DESC`,
        dateParams,
      );

      const breakdown = breakdownResult.rows.map((r) => ({
        category: r.category || 'Uncategorized',
        count: parseInt(r.count, 10),
        percentage: total > 0 ? Math.round((parseInt(r.count, 10) / total) * 10000) / 100 : 0,
      }));

      reportData = { total, breakdown };

      const topCategory = breakdown.length > 0 ? breakdown[0] : null;
      summary = `Category Breakdown Report: ${total} total issues across ${breakdown.length} categories. `;
      if (topCategory) {
        summary += `The most common category is "${topCategory.category}" with ${topCategory.count} issues (${topCategory.percentage}%). `;
        if (topCategory.percentage > 40) {
          summary += 'This category represents a significant concentration of issues and should be prioritized for systematic improvement.';
        } else {
          summary += 'Issue distribution is relatively balanced across categories.';
        }
      }
    } else {
      // escalation-analysis
      const escWhereClause = dateConditions.length > 0
        ? `WHERE ${dateConditions.map((c) => c.replace('created_at', 'e.created_at')).join(' AND ')}`
        : '';

      const totalEscalations = await query(
        `SELECT COUNT(*) AS total FROM gemba.issue_escalations e ${escWhereClause}`,
        dateParams,
      );

      const byLevelResult = await query(
        `SELECT e.from_level, e.to_level, COUNT(*) AS count
         FROM gemba.issue_escalations e
         ${escWhereClause}
         GROUP BY e.from_level, e.to_level
         ORDER BY count DESC`,
        dateParams,
      );

      const totalIssues = await query('SELECT COUNT(*) AS total FROM gemba.issues');
      const totalEsc = parseInt(totalEscalations.rows[0].total, 10);
      const totalIss = parseInt(totalIssues.rows[0].total, 10);
      const escalationRate = totalIss > 0 ? Math.round((totalEsc / totalIss) * 10000) / 100 : 0;

      reportData = {
        total_escalations: totalEsc,
        total_issues: totalIss,
        escalation_rate: escalationRate,
        by_level_transition: byLevelResult.rows.map((r) => ({
          from_level: r.from_level,
          to_level: r.to_level,
          count: parseInt(r.count, 10),
        })),
      };

      summary = `Escalation Analysis Report: ${totalEsc} escalations out of ${totalIss} total issues (${escalationRate}% escalation rate). `;
      if (escalationRate > 30) {
        summary += 'High escalation rate indicates issues are not being resolved at their initial level. Review L1 team capabilities and training needs.';
      } else if (escalationRate > 15) {
        summary += 'Moderate escalation rate. Identify common escalation patterns to improve first-level resolution capability.';
      } else {
        summary += 'Escalation rate is within healthy bounds, indicating effective issue resolution at initial levels.';
      }
    }

    res.json(success({
      report_type,
      generated_at: new Date().toISOString(),
      from_date: from_date || null,
      to_date: to_date || null,
      summary,
      data: reportData,
    }));
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({
        data: null, meta: null,
        errors: [{ code: err.code, message: err.message }],
      });
      return;
    }
    throw err;
  }
});

export default router;
