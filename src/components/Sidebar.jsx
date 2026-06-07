export default function Sidebar({ setPage, logout }) {
  return (
    <div style={{ width: 250, background: "#121212", height: "100vh", color: "#fff" }}>
      
      <button onClick={() => setPage("dashboard")}>Dashboard</button>
      <button onClick={() => setPage("materials")}>Materials</button>
      <button onClick={() => setPage("returns")}>Returns</button>

      <button
        onClick={logout}
        style={{ marginTop: 20, background: "red", color: "#fff" }}
      >
        Logout
      </button>

    </div>
  );
}