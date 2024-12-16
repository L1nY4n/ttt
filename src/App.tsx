import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Home  from "./Home";
import { QuitConfirm } from "./pages/quit_confirm";
import { Updater } from "./pages/updater";

function App() {
  return (
    <BrowserRouter>
    <Routes  >
   
      <Route path="/updater" element={<Updater />} />
      <Route path="/quit" element={<QuitConfirm />} />
      <Route index path="/*" element={<Home />} />
    </Routes>
    </BrowserRouter>
  );
}

export default App;
