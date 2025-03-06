import React from "react";
import ChatWidget from "./components/chat/ChatWidget";

function App() {
  return (
    <div className="min-h-screen bg-background text-primary font-gilda flex flex-col items-center">
      {/* Logo at 20% original size */}
      <img
        src="https://i.imgur.com/qfTW5j0.png"
        alt="Milea Estate Vineyard Logo"
        className="w-1/5 mt-6"
      />

      {/* Title Section */}
      <h1 className="text-4xl mt-4 font-bold">Welcome to Milea Estate Vineyard</h1>
      <p className="text-lg mt-2 mb-6">Ask us about our wines, events, and more!</p>

      {/* Chat Widget spanning across page */}
      <div className="w-3/4 max-w-4xl">
        <ChatWidget />
      </div>
    </div>
  );
}

export default App;
