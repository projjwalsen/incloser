import { Router } from "express";
import {
  agencyAuthController,
  agencyPortalController,
} from "../../controllers/agencyPortal.controller.js";
import { requireAgencyAuth } from "../../middleware/agencyAuth.js";

/** Public agency login — mount before admin requireAuth. */
export const agencyAuthRoutes = Router();
agencyAuthRoutes.post("/agency-auth/login", agencyAuthController.login);

/** Agency self-service portal — mount with requireAgencyAuth before admin requireAuth. */
export const agencyPortalRoutes = Router();
agencyPortalRoutes.use(requireAgencyAuth);
agencyPortalRoutes.get("/agency-portal/dashboard", agencyPortalController.dashboard);
agencyPortalRoutes.post("/agency-portal/withdrawals", agencyPortalController.requestWithdrawal);
