import { configureStore } from '@reduxjs/toolkit'
import userReducer from "./user/userSlice.js"
import {persistStore, persistReducer} from "redux-persist"
import storage from "redux-persist/lib/storage"

const rootReducer = combineReducers({
  user: userReducer
})
const persistConfig = {
  key: "root",
  storage,
  version: 1
}
const persistredReducer = persistReducer(persistConfig, rootReducer);
export const store = configureStore({
  reducer: persistredReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({serializableCheck: false})
})
export const persistor = persistStore(store);
