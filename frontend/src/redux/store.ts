import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./auth/authSlice";
import categoryReducer from "./categories/categorySlice";
import productReducer from "./products/productSlice";
import cartReducer from "./cart/cartSlice";
import orderReducer from "./order/orderSlice";
import bannerReducer from "./banners/bannerSlice";
import reviewReducer from "./reviews/reviewSlice";
import wishlistReducer from "./wishlist/wishlistSlice";
import visitReducer from "./visits/visitSlice";
import notificationReducer from "./notifications/notificationSlice";
import searchReducer from "./search/searchSlice";

export const rootReducer = combineReducers({
  auth: authReducer,
  categories: categoryReducer,
  products: productReducer,
  search: searchReducer,
  cart: cartReducer,
  orders: orderReducer,
  banners: bannerReducer,
  reviews: reviewReducer,
  wishlist: wishlistReducer,
  visits: visitReducer,
  notifications: notificationReducer,
});


export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;