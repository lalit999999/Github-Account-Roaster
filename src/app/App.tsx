import { Routes, Route, Navigate } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { RoastPage } from "./pages/RoastPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/:username" element={<RoastPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
