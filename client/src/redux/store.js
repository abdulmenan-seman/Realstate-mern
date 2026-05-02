import { configureStore } from '@reduxjs/toolkit'
import userReducer from "./user/userSlice.js"
import {persistStore, persistReducer} from "redux-persist"
import { combineReducers } from 'redux'
import storage from "redux-persist/lib/storage"

const rootReducer = combineReducers({
  user: userReducer
})
const storageEngine = storage?.default ?? storage
const persistConfig = {
  key: "root",
  storage: storageEngine,
  version: 1
}
const persistredReducer = persistReducer(persistConfig, rootReducer);
export const store = configureStore({
  reducer: persistredReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({serializableCheck: false})
})
export const persistor = persistStore(store);
