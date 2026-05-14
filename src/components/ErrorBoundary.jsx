import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            fontFamily: "sans-serif",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div>
            <h2 style={{ color: "#c0392b" }}>Algo deu errado ao carregar o CodeFlip.</h2>
            <p style={{ color: "#555", marginTop: "0.5rem" }}>
              Tente recarregar a página. Se o problema persistir, verifique o console do navegador para mais detalhes.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1.5rem",
                background: "#2c3e50",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
