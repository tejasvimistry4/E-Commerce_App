import { RootState } from "../store";

export const selectVisitsState = (state: RootState) => state.visits;
export const selectAdminVisits = (state: RootState) => state.visits.adminVisits;
export const selectAdminVisitsPagination = (state: RootState) => state.visits.adminPagination;
export const selectAdminVisitsStats = (state: RootState) => state.visits.adminStats;
export const selectRankedProducts = (state: RootState) => state.visits.rankedProducts;
export const selectRankedStats = (state: RootState) => state.visits.rankedStats;
export const selectHighlyInterested = (state: RootState) => state.visits.highlyInterested;
export const selectRecentVisits = (state: RootState) => state.visits.recentVisits;
export const selectCurrentVisitStatus = (state: RootState) => state.visits.currentVisitStatus;
export const selectVisitsLoading = (state: RootState) => state.visits.loading;
export const selectRankedLoading = (state: RootState) => state.visits.rankedLoading;
export const selectVisitsActionLoading = (state: RootState) => state.visits.actionLoading;
export const selectVisitsError = (state: RootState) => state.visits.error;
