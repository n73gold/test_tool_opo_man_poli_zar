import { useState, useEffect } from "react";

function parseExcel(rows) {
  return rows.slice(1).map(row => {
    const correcta = String(row[11]).toLowerCase().trim();

    return {
      categoria: String(row[0]).toLowerCase(), // Temario
      tema: row[1],                            // Tema
      descripcionTema: row[2],   // Descripcion_Tema (C)
      texto: row[6],                           // Enunciado
      respuestas: [
        { texto: row[7], correcta: correcta === "a" },
        { texto: row[8], correcta: correcta === "b" },
        { texto: row[9], correcta: correcta === "c" },
        { texto: row[10], correcta: correcta === "d" }
      ]
    };
  });
}


function App() {
  const [mensaje, setMensaje] = useState("");
  const [totalPreguntas, setTotalPreguntas] = useState(0);

  const [pantalla, setPantalla] = useState("home");
  const [preguntas, setPreguntas] = useState([]);
  const [preguntaActual, setPreguntaActual] = useState(null);
  const [respondida, setRespondida] = useState(false);

  const [tipoTest, setTipoTest] = useState(null);
  const [preguntasTest, setPreguntasTest] = useState([]);
  const [indicePregunta, setIndicePregunta] = useState(0);

  const [aciertos, setAciertos] = useState(0);

  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState(null);

  const [temasDisponibles, setTemasDisponibles] = useState([]);
  const [temasSeleccionados, setTemasSeleccionados] = useState([]);


  useEffect(() => {
    const guardadas = localStorage.getItem("preguntas");

    if (guardadas) {
      const data = JSON.parse(guardadas);
      setPreguntas(data);
      setTotalPreguntas(data.length);
      setMensaje(`Base de datos cargada (${data.length} preguntas)`);
    }

    fetch("/preguntas.json")
      .then(res => res.json())
      .then(data => {
        localStorage.setItem("preguntas", JSON.stringify(data));
        setPreguntas(data);
        setTotalPreguntas(data.length);
        setMensaje(`Base de datos cargada (${data.length} preguntas)`);
      })
      .catch(() => {
        // si no hay red, no pasa nada
      });
  }, []);


  function barajar(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  function empezarTest(tipo) {
    setTipoTest(tipo);

    if (tipo === "mixto") {
      const juridico = preguntas.filter(p => p.categoria === "juridico");
      const especifico = preguntas.filter(p => p.categoria === "especifico");

      const mitad = 10;

      const seleccionadas = [
        ...barajar(juridico).slice(0, mitad),
        ...barajar(especifico).slice(0, mitad)
      ];

      const mezcladas = barajar(seleccionadas);

      setPreguntasTest(mezcladas);
      setIndicePregunta(0);
      setPreguntaActual(mezcladas[0]);
      setRespondida(false);
      setRespuestaSeleccionada(null);
      setAciertos(0);
      setPantalla("pregunta");
      return;
    }

    let filtradas = preguntas.filter(p => p.categoria === tipo);

    const temasUnicos = Array.from(
      new Map(
        filtradas.map(p => [
          p.tema,
          { tema: p.tema, descripcion: p.descripcionTema }
        ])
      ).values()
    );

    setTemasDisponibles(temasUnicos);
    setTemasSeleccionados([]);
    setPantalla("temas");
  }

  function responder(indice) {
    setRespuestaSeleccionada(indice);
    setRespondida(true);

    if (preguntaActual.respuestas[indice].correcta) {
      setAciertos(prev => prev + 1);
    }
  }

  function siguientePregunta() {
    const siguiente = indicePregunta + 1;

    if (siguiente < preguntasTest.length) {
      setIndicePregunta(siguiente);
      setPreguntaActual(preguntasTest[siguiente]);
      setRespondida(false);
      setRespuestaSeleccionada(null);
    } else {
      // Test terminado
      setPantalla("resumen");
    }
  }

  function iniciarTestConTemas() {
    let filtradas = preguntas;

    if (tipoTest !== "mixto") {
      filtradas = preguntas.filter(p => p.categoria === tipoTest);
    }

    filtradas = filtradas.filter(p =>
      temasSeleccionados.includes(p.tema)
    );

    const seleccionadas = barajar(filtradas).slice(0, 20);

    setPreguntasTest(seleccionadas);
    setIndicePregunta(0);
    setPreguntaActual(seleccionadas[0]);
    setRespondida(false);
    setRespuestaSeleccionada(null);
    setAciertos(0);
    setPantalla("pregunta");
  }

  return (
  <div style={{ padding: 20 }}>
    <h1>Test Oposiciones</h1>

    {totalPreguntas > 0 && (
      <p>📊 Preguntas disponibles: {totalPreguntas}</p>
    )}

    {/* HOME */}
    {pantalla === "home" && (
      <>

        <br />

        <button
          style={{ padding: 10, fontSize: 16 }}
          disabled={totalPreguntas === 0}
          onClick={() => setPantalla("tipo")}
        >
          Hacer test
        </button>
      </>
    )}

    {/* SELECCIÓN DE TIPO */}
    {pantalla === "tipo" && (
      <>
        <h2>Selecciona tipo de test</h2>

        <button onClick={() => empezarTest("juridico")}>
          Jurídico
        </button>
        <br /><br />

        <button onClick={() => empezarTest("especifico")}>
          Específico
        </button>
        <br /><br />

        <button onClick={() => empezarTest("mixto")}>
          Mixto
        </button>
        <br /><br />

        <button onClick={() => setPantalla("home")}>
          Volver
        </button>
      </>
    )}

    {/* SELECCIÓN DE TEMAS */}
    {pantalla === "temas" && (
      <>
        <h2>Selecciona los temas</h2>

        {temasDisponibles.map((t, i) => (
          <label key={i} style={{ display: "block", marginBottom: 6 }}>
            <input
              type="checkbox"
              checked={temasSeleccionados.includes(t.tema)}
              onChange={(e) => {
                if (e.target.checked) {
                  setTemasSeleccionados(prev => [...prev, t.tema]);
                } else {
                  setTemasSeleccionados(prev =>
                    prev.filter(x => x !== t.tema)
                  );
                }
              }}
            />
            {" "}
            {t.tema} - {t.descripcion}
          </label>
        ))}

        <br />

        <button
          disabled={temasSeleccionados.length === 0}
          onClick={() => iniciarTestConTemas()}
        >
          Empezar test
        </button>

        <br /><br />

        <button onClick={() => setPantalla("tipo")}>
          Volver
        </button>
      </>
    )}

    {/* PREGUNTA */}
    {pantalla === "pregunta" && preguntaActual && (
      <>
        <p>
          Pregunta {indicePregunta + 1} / {preguntasTest.length}
        </p>

        <h3>{preguntaActual.texto}</h3>

        {preguntaActual.respuestas.map((r, i) => (
          <button
            key={i}
            disabled={respondida}
            onClick={() => responder(i)}
            style={{
              display: "block",
              width: "100%",
              marginBottom: 8,
              padding: 10,
              backgroundColor: respondida
                ? i === respuestaSeleccionada
                  ? r.correcta
                    ? "lightgreen"
                    : "salmon"
                  : r.correcta
                    ? "lightgreen"
                    : "white"
                : "white",
              color: "black",
              opacity: 1
            }}
          >
            {r.texto}
          </button>
        ))}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 30
          }}
        >
          {/* Finalizar test - izquierda */}
          <button
            onClick={() => {
              setPantalla("resumen");
            }}
          >
            Finalizar test
          </button>

          {/* Siguiente pregunta - derecha */}
          {respondida && (
            <button onClick={siguientePregunta}>
              Siguiente pregunta
            </button>
          )}
        </div>

      </>
    )}

    {/* RESUMEN */}
    {pantalla === "resumen" && (
      <>
        <h2>Resumen del test</h2>

          <p>
            Acertadas {aciertos} de {indicePregunta + 1} preguntas
          </p>

          <p>
            Porcentaje de aciertos:{" "}
            {Math.round((aciertos / (indicePregunta + 1)) * 100)} %
          </p>
          <p>
            {Math.round((aciertos / (indicePregunta + 1)) * 100) >= 80
              ? "Excelente resultado 💪"
              : Math.round((aciertos / (indicePregunta + 1)) * 100) >= 60
              ? "Buen resultado 👍"
              : "Conviene repasar 📘"}
          </p>

        <button
          onClick={() => {
            setPantalla("tipo");
            setPreguntasTest([]);
            setIndicePregunta(0);
            setPreguntaActual(null);
            setRespondida(false);
            setRespuestaSeleccionada(null);
            setAciertos(0);
          }}
        >
          Volver
        </button>
      </>
    )}

    <p>{mensaje}</p>
  </div>
);

}

export default App;