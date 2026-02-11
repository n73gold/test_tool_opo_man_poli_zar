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
      const data = JSON.parse(guardadas).map((p, index) => ({
        ...p,
        _id: index
      }));

      setPreguntas(data);
      setTotalPreguntas(data.length);
    }


    fetch(import.meta.env.BASE_URL + "preguntas.json")
      .then(res => res.json())
      .then(data => {
        const conId = data.map((p, index) => ({
          ...p,
          _id: index
        }));

        localStorage.setItem("preguntas", JSON.stringify(conId));
        setPreguntas(conId);
        setTotalPreguntas(conId.length);
      })

      .catch(() => {
        // si no hay red, no pasa nada
      });
  }, []);


  function barajar(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }

  const MAX_TESTS_RECIENTES = 5;

  function getTestsRecientes() {
    return JSON.parse(localStorage.getItem("testsRecientes") || "[]");
  }

  function getIdsRecientes() {
    return getTestsRecientes().flat();
  }

  function guardarTestReciente(preguntasTest) {
    const tests = getTestsRecientes();

    const ids = preguntasTest.map(p => p._id);

    tests.push(ids);

    if (tests.length > MAX_TESTS_RECIENTES) {
      tests.shift(); // elimina el más antiguo
    }

    localStorage.setItem("testsRecientes", JSON.stringify(tests));
  }


  function empezarTest(tipo) {
    setTipoTest(tipo);

    if (tipo === "mixto") {
      const juridico = preguntas.filter(p => p.categoria === "jurídico");
      const especifico = preguntas.filter(p => p.categoria === "específico");

      const mitad = 10;

      const seleccionadas = [
        ...barajar(juridico).slice(0, mitad),
        ...barajar(especifico).slice(0, mitad)
      ];

      const idsRecientes = getIdsRecientes();

      let disponibles = seleccionadas.filter(
        p => !idsRecientes.includes(p._id)
      );

      // fallback
      if (disponibles.length < 20) {
        disponibles = seleccionadas;
      }

      const mezcladas = barajar(disponibles);

      guardarTestReciente(mezcladas);


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

    const idsRecientes = getIdsRecientes();

    let disponibles = filtradas.filter(
      p => !idsRecientes.includes(p._id)
    );

    // fallback si no hay suficientes
    if (disponibles.length < 20) {
      disponibles = filtradas;
    }

    const seleccionadas = barajar(disponibles).slice(0, 20);

    guardarTestReciente(seleccionadas);

    setPreguntasTest(seleccionadas);
    setIndicePregunta(0);
    setPreguntaActual(seleccionadas[0]);
    setRespondida(false);
    setRespuestaSeleccionada(null);
    setAciertos(0);
    setPantalla("pregunta");
  }

  function iniciarTestAleatorio() {
    let filtradas = preguntas;

    if (tipoTest !== "mixto") {
      filtradas = preguntas.filter(p => p.categoria === tipoTest);
    }

    const idsRecientes = getIdsRecientes();

    let disponibles = filtradas.filter(
      p => !idsRecientes.includes(p._id)
    );

    if (disponibles.length < 20) {
      disponibles = filtradas;
    }

    const seleccionadas = barajar(disponibles).slice(0, 20);

    guardarTestReciente(seleccionadas);

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

    {/* HOME */}
    {pantalla === "home" && (
      <>
        <h1>Test Oposiciones</h1>

        {totalPreguntas > 0 && (
          <p>📊 Preguntas disponibles: {totalPreguntas}</p>
        )}

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

        <button onClick={() => empezarTest("jurídico")}>
          Jurídico
        </button>
        <br /><br />

        <button onClick={() => empezarTest("específico")}>
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

        <div style={{ display: "flex", gap: 10 }}>
          <button
            disabled={temasSeleccionados.length === 0}
            onClick={() => iniciarTestConTemas()}
          >
            Empezar test
          </button>

          <button
            onClick={() => iniciarTestAleatorio()}
          >
            🎲 Test aleatorio
          </button>
        </div>


        <br /><br />

        <button onClick={() => setPantalla("tipo")}>
          Volver
        </button>
      </>
    )}

    {/* PREGUNTA */}
    {pantalla === "pregunta" && preguntaActual && (
      <>
        <h2 style={{ marginBottom: 4 }}>
          {tipoTest === "jurídico"
            ? "Jurídico"
            : tipoTest === "específico"
            ? "Específico"
            : "Mixto"}
        </h2>

        <p style={{ fontSize: 14, opacity: 0.8, marginTop: 0 }}>
          {preguntaActual.descripcionTema}
        </p>

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

    <hr style={{ marginTop: 30, opacity: 0.3 }} />

    <p style={{ fontSize: 12, opacity: 0.6 }}>
      Versión {__APP_VERSION__}
    </p>

  </div>
);

}

export default App;