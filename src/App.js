import "./App.css";
import Dashboard from "./pages/dashboard/Dashboard";
import 'bootstrap/dist/css/bootstrap.min.css';
import React, {useEffect, useState} from "react";
import {initializeApp} from "firebase/app";
import {getDatabase} from "firebase/database";
import Loader from "./components/Loader";

const firebaseConfig = {
  apiKey: "AIzaSyB6jgAYZFaJhpzVcoZ9hox6h6iVGq6Ozqo",
  authDomain: "songreader-f7e8c.firebaseapp.com",
  databaseURL: "https://songreader-f7e8c.firebaseio.com",
  projectId: "songreader-f7e8c",
  storageBucket: "songreader-f7e8c.appspot.com",
  messagingSenderId: "703302008821",
  appId: "1:703302008821:web:826c661d4e80de2a732abc"
};

const App = () => {
  const [db, setDb] = useState(null);

  useEffect(() => {
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);

    setDb(db);
  }, []);

  if(!db) {
    return <Loader/>
  }

  return (
      <Dashboard
          db={db}
      />
  );
};

export default App;
