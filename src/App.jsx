import { useState, useEffect } from "react";
import { LabelList } from "recharts";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";


function parseExcel(rows) {
  return rows.slice(1).map(row => {
    const correcta = String(row[11]).toLowerCase().trim();

    return {
      categoria: String(row[0]).toLowerCase(), // Temario
      tema: row[1],                            // Tema
      descripcionTema: row[2],   // Descripcion_Tema (C)
      nombreExamen: row[4],                   // Descripcion_Test
      numeroPreguntaExamen: row[5],             //Nr pregunta en test
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
  
  const [tipoTest, setTipoTest] = useState(null);
  const [preguntasTest, setPreguntasTest] = useState([]);
  const [indicePregunta, setIndicePregunta] = useState(0);

  const [aciertos, setAciertos] = useState(0);
  
  const [temasDisponibles, setTemasDisponibles] = useState([]);
  const [temasSeleccionados, setTemasSeleccionados] = useState([]);

  const [testActual, setTestActual] = useState(null);

  const [modoTest, setModoTest] = useState("practica");

  const [preguntasRevision, setPreguntasRevision] = useState(null);

  const [modoFavoritas, setModoFavoritas] = useState(false);

  const [configOposicion, setConfigOposicion] = useState(20);

  const [penalizacionOposicion, setPenalizacionOposicion] = useState(3);

  const [historico, setHistorico] = useState([]);

  const [semanaAbierta, setSemanaAbierta] = useState(null);

  const [desdeRepaso, setDesdeRepaso] = useState(false);

  const MAX_TESTS_RECIENTES = 5;

  const version = __APP_VERSION__;

  const preguntasActivas = preguntasRevision ?? preguntasTest;

  const [temasActivos, setTemasActivos] = useState([]);

  const [preguntasPorTema, setPreguntasPorTema] = useState({});

  const [repasoPendientes, setRepasoPendientes] = useState([]);

  const [repasoAciertos, setRepasoAciertos] = useState({});

  const [pomodoroMode, setPomodoroMode] = useState("work"); // work | break
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroPaused, setPomodoroPaused] = useState(false);
  const [pomodoroStart, setPomodoroStart] = useState(null);
  const [workDuration, setWorkDuration] = useState("25");   // minutos
  const [breakDuration, setBreakDuration] = useState("5");  // minutos
  const [pomodoroElapsed, setPomodoroElapsed] = useState(0); // segundos
  const [pomodoroStats, setPomodoroStats] = useState({
    totalMinutes: 0,
    byDay: {},
    byWeek: {}
  });

  const cardStyle = {
    background: "linear-gradient(135deg, #4f46e5, #3b82f6)",
    borderRadius: 20,
    padding: 14,
    textAlign: "center",
    color: "white",
    cursor: "pointer",
    boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 80,
    transition: "transform 0.15s ease"
  };

  const cardNumberStyle = {
    fontSize: 36,
    margin: 0
  };

  const cardTextStyle = {
    marginTop: 10,
    fontSize: 14,
    opacity: 0.95
  };

  useEffect(() => {
    const guardadas = localStorage.getItem("preguntas");
    setHistorico(getHistorico());
    const temasGuardados = JSON.parse(localStorage.getItem("temasActivos") || "null");

    if (temasGuardados) {
      setTemasActivos(temasGuardados);
    }

    if (guardadas) {
      const data = JSON.parse(guardadas);

      setPreguntas(data);
      setTotalPreguntas(data.length);
    }

    fetch(import.meta.env.BASE_URL + "preguntas.json")
      .then(res => res.json())
      .then(data => {
        localStorage.setItem("preguntas", JSON.stringify(data));
        setPreguntas(data);
        setTotalPreguntas(data.length);
        // Inicializar temas activos si no existen
        const temasUnicos = Array.from(new Set(data.map(p => p.tema)));

        if (!localStorage.getItem("temasActivos")) {
          setTemasActivos(temasUnicos);
          localStorage.setItem("temasActivos", JSON.stringify(temasUnicos));
        }
      })


      .catch(() => {
        // si no hay red, no pasa nada
      });

      setHistorico(getHistorico());

      const savedPomodoro = JSON.parse(localStorage.getItem("pomodoroStats") || "null");
      if (savedPomodoro) {
        setPomodoroStats(savedPomodoro);
      }

      const savedPreguntasPorTema = JSON.parse(
        localStorage.getItem("preguntasPorTema") || "{}"
      );
      setPreguntasPorTema(savedPreguntasPorTema);


      const savedRepasoPendientes = JSON.parse(
        localStorage.getItem("repasoPendientes") || "[]"
      );
      setRepasoPendientes(savedRepasoPendientes);


      const savedRepasoAciertos = JSON.parse(
        localStorage.getItem("repasoAciertos") || "{}"
      );
      setRepasoAciertos(savedRepasoAciertos);

      const savedConfig = JSON.parse(localStorage.getItem("pomodoroConfig") || "null");

      if (savedConfig) {
        setWorkDuration(savedConfig.work);
        setBreakDuration(savedConfig.break);
      }


      const saved = JSON.parse(localStorage.getItem("pomodoroActive") || "null");

      if (saved) {
        const now = Date.now();

        if (saved.end > now) {
          setPomodoroMode(saved.mode);
          setPomodoroStart(saved.start);
          setPomodoroEnd(saved.end);
          setPomodoroRunning(true);
        } else {
          localStorage.removeItem("pomodoroActive");
        }
      }

  }, []);
  
  useEffect(() => {
    localStorage.setItem("pomodoroConfig", JSON.stringify({
      work: workDuration,
      break: breakDuration
    }));
  }, [workDuration, breakDuration]);

  // ⏱️ Motor del Pomodoro (contador hacia delante)
  useEffect(() => {

    if (!pomodoroRunning || pomodoroStart === null) return;

    const interval = setInterval(() => {

      const elapsed = Math.floor((Date.now() - pomodoroStart) / 1000);
      setPomodoroElapsed(elapsed);

      const duration =
        pomodoroMode === "work"
          ? Number(workDuration) * 60
          : Number(breakDuration) * 60;


      if (elapsed >= duration) {

        clearInterval(interval);

        // 🔵 FIN DE ESTUDIO
        if (pomodoroMode === "work") {

          const confirmar = window.confirm(
            "Tiempo de estudio finalizado. ¿Iniciar descanso?"
          );

          if (confirmar) {

            // Guardamos minutos estudiados
            actualizarEstadisticasPomodoro(Number(workDuration));

            // Pasamos a descanso
            setPomodoroMode("break");
            setPomodoroStart(Date.now());
            setPomodoroElapsed(0);
            setPomodoroRunning(true);
            setPomodoroPaused(false);

          } else {
            // Si no quiere descanso, paramos todo
            setPomodoroRunning(false);
            setPomodoroPaused(false);
            setPomodoroStart(null);
            setPomodoroElapsed(0);
          }

        }

        // 🟡 FIN DE DESCANSO
        else {

          const confirmar = window.confirm(
            "Descanso finalizado. ¿Iniciar nuevo ciclo de estudio?"
          );

          if (confirmar) {

            setPomodoroMode("work");
            setPomodoroStart(Date.now());
            setPomodoroElapsed(0);
            setPomodoroRunning(true);
            setPomodoroPaused(false);

          } else {
            // Si no quiere iniciar nuevo ciclo, se detiene
            setPomodoroRunning(false);
            setPomodoroPaused(false);
            setPomodoroStart(null);
          }
        }

      }

    }, 1000);

    return () => clearInterval(interval);

  }, [
    pomodoroRunning,
    pomodoroStart,
    pomodoroMode,
    workDuration,
    breakDuration
  ]);

  function actualizarEstadisticasPomodoro(minutos) {

    const hoy = new Date();
    const fechaKey = hoy.toISOString().slice(0, 10);

    const { year, week } = getYearWeek(Date.now());
    const weekKey = `${String(year).slice(-2)}w${week}`;

    const nuevasStats = { ...pomodoroStats };

    nuevasStats.totalMinutes += minutos;

    if (!nuevasStats.byDay[fechaKey]) {
      nuevasStats.byDay[fechaKey] = 0;
    }
    nuevasStats.byDay[fechaKey] += minutos;

    if (!nuevasStats.byWeek[weekKey]) {
      nuevasStats.byWeek[weekKey] = 0;
    }
    nuevasStats.byWeek[weekKey] += minutos;

    setPomodoroStats(nuevasStats);
    localStorage.setItem("pomodoroStats", JSON.stringify(nuevasStats));
  }

  function sumarManualPomodoro() {

    const input = window.prompt("¿Cuántos minutos quieres añadir?");

    if (!input) return;

    const minutos = Number(input);

    if (isNaN(minutos) || minutos <= 0) {
      alert("Introduce un número válido de minutos.");
      return;
    }

    actualizarEstadisticasPomodoro(Math.floor(minutos));
  }

  function iniciarPomodoro() {

    // 🔁 Reanudar desde pausa
    if (pomodoroPaused) {
      const nuevoStart = Date.now() - pomodoroElapsed * 1000;
      setPomodoroStart(nuevoStart);
      setPomodoroRunning(true);
      setPomodoroPaused(false);
      return;
    }

    // ▶ Inicio normal
    setPomodoroMode("work");
    setPomodoroStart(Date.now());
    setPomodoroElapsed(0);
    setPomodoroRunning(true);
    setPomodoroPaused(false);
  }

  function pausarPomodoro() {
    if (!pomodoroRunning) return;

    setPomodoroRunning(false);
    setPomodoroPaused(true);
  }

  function terminarPomodoro() {

    const minutos = Math.floor(pomodoroElapsed / 60);

    if (minutos > 0 && pomodoroMode === "work") {

      const confirmar = window.confirm(
        `Has estudiado ${minutos} minutos. ¿Quieres guardarlos?`
      );

      if (confirmar) {
        actualizarEstadisticasPomodoro(minutos);
      }
    }

    setPomodoroRunning(false);
    setPomodoroPaused(false);
    setPomodoroElapsed(0);
    setPomodoroStart(null);
    setPomodoroMode("work");
  }

  function getHistorico() {
    return JSON.parse(localStorage.getItem("historicoTests") || "[]");
  }

  function getNextHistoricoId() {
    const current = Number(localStorage.getItem("historicoIdCounter") || 0);
    const next = current + 1;
    localStorage.setItem("historicoIdCounter", next);
    return next;
  }

  function guardarHistorico(lista) {
    localStorage.setItem("historicoTests", JSON.stringify(lista));
    setHistorico(lista);
  }

  function getFavoritas() {
    return JSON.parse(localStorage.getItem("preguntasFavoritas") || "[]");
  }

  function guardarFavoritas(lista) {
    localStorage.setItem("preguntasFavoritas", JSON.stringify(lista));
  }

  function esFavorita(id) {
    return getFavoritas().includes(id);
  }

  function toggleFavorita(id) {
    const actuales = getFavoritas();

    if (actuales.includes(id)) {
      guardarFavoritas(actuales.filter(x => x !== id));
    } else {
      guardarFavoritas([...actuales, id]);
    }

    // Forzar re-render
    setTestActual(prev => ({ ...prev }));

    // 🔧 FIX: actualizar lista en modo favoritas
    if (modoFavoritas) {
      const nuevasFavoritasIds = getFavoritas();
      const nuevasFavoritas = preguntas.filter(p =>
        nuevasFavoritasIds.includes(p.id)
      );

      if (nuevasFavoritas.length === 0) {
        // salir si no quedan favoritas
        setModoFavoritas(false);
        setPreguntasRevision(null);
        setPantalla("home");
        return;
      }

      setPreguntasRevision(nuevasFavoritas);

      // ajustar índice si se sale de rango
      if (indicePregunta >= nuevasFavoritas.length) {
        const nuevoIndice = nuevasFavoritas.length - 1;
        setIndicePregunta(nuevoIndice);
        setPreguntaActual(nuevasFavoritas[nuevoIndice]);
      } else {
        setPreguntaActual(nuevasFavoritas[indicePregunta]);
      }
    }
  }

  function barajar(array) {
    return [...array].sort(() => Math.random() - 0.5);
  }
  
  function getTestsRecientes() {
    return JSON.parse(localStorage.getItem("testsRecientes") || "[]");
  }

  function getIdsRecientes() {
    return getTestsRecientes().flat();
  }

  function getPreguntasUsadasSemana() {
    const ahora = Date.now();
    const usadas = JSON.parse(localStorage.getItem("preguntasUsadas") || "[]");

    const vigentes = usadas.filter(
      p => ahora - p.fecha < 7 * 24 * 60 * 60 * 1000
    );

    localStorage.setItem("preguntasUsadas", JSON.stringify(vigentes));

    return vigentes.map(p => p.id);
  }

  function registrarPreguntaUsada(id) {
    if (!id) return;
    const ahora = Date.now();
    const usadas = JSON.parse(localStorage.getItem("preguntasUsadas") || "[]");

    usadas.push({ id, fecha: ahora });

    localStorage.setItem("preguntasUsadas", JSON.stringify(usadas));
  }

  function guardarTestReciente(preguntasTest) {
    const tests = getTestsRecientes();

    const ids = preguntasTest.map(p => p.id);

    tests.push(ids);

    if (tests.length > MAX_TESTS_RECIENTES) {
      tests.shift(); // elimina el más antiguo
    }

    localStorage.setItem("testsRecientes", JSON.stringify(tests));
  }
  
  function getPreguntasPorTema() {
    return JSON.parse(localStorage.getItem("preguntasPorTema") || "{}");
  }

  function guardarPreguntasPorTema(stats) {
    localStorage.setItem("preguntasPorTema", JSON.stringify(stats));
    setPreguntasPorTema(stats);
  }

  function getRepasoPendientes() {
    return JSON.parse(localStorage.getItem("repasoPendientes") || "[]");
  }

  function guardarRepasoPendientes(ids) {
    const unicos = [...new Set(ids)];
    localStorage.setItem("repasoPendientes", JSON.stringify(unicos));
    setRepasoPendientes(unicos);
  }

  function getRepasoAciertos() {
    return JSON.parse(localStorage.getItem("repasoAciertos") || "{}");
  }

  function guardarRepasoAciertos(stats) {
    localStorage.setItem("repasoAciertos", JSON.stringify(stats));
    setRepasoAciertos(stats);
  }

  function agregarPreguntasARepaso(listaPreguntas) {
    const actuales = getRepasoPendientes();
    const aciertosActuales = getRepasoAciertos();

    const nuevosIds = listaPreguntas
      .map(p => p.id)
      .filter(Boolean);

    const idsFinales = [...new Set([...actuales, ...nuevosIds])];

    nuevosIds.forEach(id => {
      if (aciertosActuales[id] === undefined) {
        aciertosActuales[id] = 0;
      }
    });

    guardarRepasoPendientes(idsFinales);
    guardarRepasoAciertos(aciertosActuales);
  }

  function actualizarProgresoRepaso(test) {
    if (!test?.tipoGuardado || test.tipoGuardado !== "repaso") return;

    const pendientesActuales = getRepasoPendientes();
    const aciertosActuales = getRepasoAciertos();

    const pendientesSet = new Set(pendientesActuales);

    test.preguntas.forEach(p => {
      if (!p.id || !pendientesSet.has(p.id)) return;

      const acertada =
        p.respuestaSeleccionada !== null &&
        p.respuestas[p.respuestaSeleccionada]?.correcta;

      if (acertada) {
        aciertosActuales[p.id] = (aciertosActuales[p.id] || 0) + 1;
      }
    });

    const pendientesFinales = pendientesActuales.filter(
      id => (aciertosActuales[id] || 0) < 2
    );

    Object.keys(aciertosActuales).forEach(id => {
      if (!pendientesFinales.includes(id)) {
        delete aciertosActuales[id];
      }
    });

    guardarRepasoPendientes(pendientesFinales);
    guardarRepasoAciertos(aciertosActuales);
  }

  function iniciarTestRepaso(ids = null) {
    const idsFuente = Array.isArray(ids) ? ids : repasoPendientes;

    const idsUnicos = [...new Set(idsFuente)];

    const seleccionadas = idsUnicos
      .map(id => preguntas.find(p => p.id === id))
      .filter(Boolean);

    if (seleccionadas.length === 0) {
      alert("No hay preguntas pendientes de repaso.");
      return;
    }

    const nuevoTest = {
      modo: "practica",
      tipoGuardado: "repaso",
      nombreExamen: "Repaso",
      fechaInicio: Date.now(),
      preguntas: seleccionadas.map(p => ({
        ...p,
        respuestaSeleccionada: null,
        marcadaFavorita: false
      })),
      finalizado: false,
      fechaFin: null
    };

    setTestActual(nuevoTest);
    setPreguntasTest(nuevoTest.preguntas);
    setIndicePregunta(0);
    setPreguntaActual(nuevoTest.preguntas[0]);
    setAciertos(0);
    setPreguntasRevision(null);
    setModoFavoritas(false);
    setPantalla("pregunta");
  }

  function registrarPreguntasPorTema(listaPreguntas) {
    if (!Array.isArray(listaPreguntas) || listaPreguntas.length === 0) return;

    const stats = getPreguntasPorTema();

    listaPreguntas.forEach(p => {
      const tema = p.tema || "Sin tema";
      stats[tema] = (stats[tema] || 0) + 1;
    });

    guardarPreguntasPorTema(stats);
  }

  function barajarConEquilibrioPorTema(lista) {
    const stats = getPreguntasPorTema();

    return [...lista]
      .map(p => ({
        ...p,
        __scoreTema: stats[p.tema] || 0,
        __random: Math.random()
      }))
      .sort((a, b) => {
        if (a.__scoreTema !== b.__scoreTema) {
          return a.__scoreTema - b.__scoreTema;
        }
        return a.__random - b.__random;
      })
      .map(({ __scoreTema, __random, ...p }) => p);
  }

  function seleccionarPreguntasEquilibradas(lista, cantidad) {
    if (!Array.isArray(lista) || lista.length === 0) return [];

    return barajarConEquilibrioPorTema(lista).slice(0, cantidad);
  }

  function guardarHistoricoTest(test) {

    const juridico = test.preguntas.filter(p => p.categoria === "jurídico");
    const especifico = test.preguntas.filter(p => p.categoria === "específico");

    const aciertosJuridico = juridico.filter(p =>
      p.respuestaSeleccionada !== null &&
      p.respuestas[p.respuestaSeleccionada]?.correcta
    ).length;

    const aciertosEspecifico = especifico.filter(p =>
      p.respuestaSeleccionada !== null &&
      p.respuestas[p.respuestaSeleccionada]?.correcta
    ).length;

    const respondidasJuridico = juridico.filter(
      p => p.respuestaSeleccionada !== null
    ).length;

    const respondidasEspecifico = especifico.filter(
      p => p.respuestaSeleccionada !== null
    ).length;

    const porcentajeJuridico = (test.modo === "rapido"
      ? respondidasJuridico > 0
      : juridico.length > 0)
      ? Math.round(
          (aciertosJuridico /
            (test.modo === "rapido" ? respondidasJuridico : juridico.length)) * 100
        )
      : null;

    const porcentajeEspecifico = (test.modo === "rapido"
      ? respondidasEspecifico > 0
      : especifico.length > 0)
      ? Math.round(
          (aciertosEspecifico /
            (test.modo === "rapido" ? respondidasEspecifico : especifico.length)) * 100
        )
      : null;

    let nota = null;
    let aciertos = null;
    let fallos = null;

    if (test.modo === "oposicion") {

      let correctas = 0;
      let incorrectas = 0;

      test.preguntas.forEach(p => {
        if (p.respuestaSeleccionada !== null) {
          if (p.respuestas[p.respuestaSeleccionada]?.correcta) {
            correctas++;
          } else {
            incorrectas++;
          }
        }
      });

      const divisor = test.penalizacion || 3;
      const neta = Math.max(0, correctas - incorrectas / divisor);
      nota = test.preguntas.length > 0
        ? (neta / test.preguntas.length) * 10
        : 0;

      aciertos = correctas;
      fallos = incorrectas;
    }

    let nombreExamenGuardado = test.nombreExamen || null;

    if (test.modo === "rapido") {
      const partes = [];

      if (porcentajeJuridico !== null) {
        partes.push(`J${porcentajeJuridico}%`);
      }

      if (porcentajeEspecifico !== null) {
        partes.push(`E${porcentajeEspecifico}%`);
      }

      nombreExamenGuardado = `${getNombreFlash()} ${partes.join(" ")}`.trim();
    }

    const nuevoRegistro = {
      id: getNextHistoricoId(),
      fecha: Date.now(),
      modo: test.modo,
      porcentajeJuridico,
      porcentajeEspecifico,
      nota,
      aciertos,
      fallos,
      tipoGuardado: test.tipoGuardado || null,
      nombreExamen: nombreExamenGuardado,
    };

    const historicoActual = getHistorico();

    const nuevoHistorico = [...historicoActual, nuevoRegistro];

    guardarHistorico(nuevoHistorico); // 👈 ESTA ES LA CLAVE
  }

  function borrarTest(id) {
    const nuevoHistorico = historico.filter(h => h.id !== id);
    guardarHistorico(nuevoHistorico);
  }

  function getNombreFlash() {
    const ahora = new Date();
    const dia = String(ahora.getDate()).padStart(2, "0");
    const mes = String(ahora.getMonth() + 1).padStart(2, "0");
    const anio = ahora.getFullYear();

    return `${dia}/${mes}/${anio} flash`;
  }

  function getYearWeek(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    // jueves de esta semana
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));

    const week1 = new Date(d.getFullYear(), 0, 4);
    const weekNumber =
      1 +
      Math.round(
        ((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
      );

    return {
      year: d.getFullYear(),
      week: String(weekNumber).padStart(2, "0")
    };
  }

  function getTestsSemanaActual() {
    const ahora = getYearWeek(Date.now());

    return historico.filter(h => {
      const hw = getYearWeek(h.fecha);
      return hw.year === ahora.year && hw.week === ahora.week;
    }).length;
  }

  function getHistoricoAgrupadoPorSemana() {
    const agrupado = {};

    historico.forEach(h => {
      const { year, week } = getYearWeek(h.fecha);
      const clave = `${String(year).slice(-2)}w${week}`;

      if (!agrupado[clave]) {
        agrupado[clave] = 0;
      }

      agrupado[clave]++;
    });

    return agrupado;
  }

  function getSemanasOrdenadas() {
    const agrupado = getHistoricoAgrupadoPorSemana();

    return Object.entries(agrupado)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([semana, total]) => ({
        semana,
        total
      }));
  }

  function getEstadisticasMediaSemanal() {
    const agrupado = {};

    historico.forEach(h => {
      const { year, week } = getYearWeek(h.fecha);
      const clave = `${String(year).slice(-2)}w${week}`;

      if (!agrupado[clave]) {
        agrupado[clave] = {
          juridico: [],
          especifico: []
        };
      }

      if (h.porcentajeJuridico !== null) {
        agrupado[clave].juridico.push(h.porcentajeJuridico);
      }

      if (h.porcentajeEspecifico !== null) {
        agrupado[clave].especifico.push(h.porcentajeEspecifico);
      }
    });

    return Object.entries(agrupado)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([semana, valores]) => ({
        semana,
        juridico:
          valores.juridico.length > 0
            ? Math.round(
                valores.juridico.reduce((a, b) => a + b, 0) /
                valores.juridico.length
              )
            : null,
        especifico:
          valores.especifico.length > 0
            ? Math.round(
                valores.especifico.reduce((a, b) => a + b, 0) /
                valores.especifico.length
              )
            : null
      }));
  }

  function getDatosEstadisticas() {
    const agrupado = {};

    historico.forEach(h => {
      const { year, week } = getYearWeek(h.fecha);
      const clave = `${String(year).slice(-2)}w${week}`;

      if (!agrupado[clave]) {
        agrupado[clave] = {
          juridico: [],
          especifico: []
        };
      }

      if (h.porcentajeJuridico !== null) {
        agrupado[clave].juridico.push(h.porcentajeJuridico);
      }

      if (h.porcentajeEspecifico !== null) {
        agrupado[clave].especifico.push(h.porcentajeEspecifico);
      }
    });

    return Object.entries(agrupado)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([semana, valores]) => {
        const media = arr =>
          arr.length === 0
            ? null
            : Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

        return {
          semana,
          juridico: media(valores.juridico),
          especifico: media(valores.especifico)
        };
      });
  }

  function getNumeroPreguntaRapidaActual() {
    if (!testActual?.preguntas) return 1;

    const respondidasAntes = testActual.preguntas
      .slice(0, indicePregunta)
      .filter(p => p.respuestaSeleccionada !== null).length;

    return respondidasAntes + 1;
  }

  function empezarTest(tipo) {
    setTipoTest(tipo);

    if (tipo === "mixto") {
      const juridico = preguntas.filter(
        p => p.categoria === "jurídico" && temasActivos.includes(p.tema)
      );
      const especifico = preguntas.filter(
        p => p.categoria === "específico" && temasActivos.includes(p.tema)
      );

      const mitad = 10;

      const seleccionBase = [
        ...seleccionarPreguntasEquilibradas(juridico, mitad),
        ...seleccionarPreguntasEquilibradas(especifico, mitad)
      ];

      const idsRecientes = [
        ...getIdsRecientes(),
        ...getPreguntasUsadasSemana()
      ];

      let disponibles = seleccionBase.filter(
        p => !idsRecientes.includes(p.id)
      );


      if (disponibles.length < 20) {
        disponibles = seleccionBase;
      }

      const mezcladas = barajarConEquilibrioPorTema(disponibles);

      guardarTestReciente(mezcladas);
      mezcladas.forEach(p => registrarPreguntaUsada(p.id));
      registrarPreguntasPorTema(mezcladas);

      const nuevoTest = {
        modo: modoTest,
        fechaInicio: Date.now(),
        preguntas: mezcladas.map(p => ({
          ...p,
          respuestaSeleccionada: null,
          marcadaFavorita: false
        })),
        finalizado: false,
        fechaFin: null
      };

      setTestActual(nuevoTest);

      setPreguntasTest(nuevoTest.preguntas);
      setIndicePregunta(0);
      setPreguntaActual(nuevoTest.preguntas[0]);
      setAciertos(0);
      setPreguntasRevision(null);
      setPantalla("pregunta");
      return;

    }

    let filtradas = preguntas.filter(
      p => p.categoria === tipo && temasActivos.includes(p.tema)
    );

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
    if (!testActual) return;

    const copiaTest = { ...testActual };
    const copiaPreguntas = [...copiaTest.preguntas];

    const pregunta = copiaPreguntas[indicePregunta];

    // En modo práctica no permitimos cambiar respuesta
    if (
      (testActual.modo === "practica" || testActual.modo === "rapido") &&
      pregunta.respuestaSeleccionada !== null
    ) return;

    // 🔵 En modo oposición permitimos des-seleccionar
    if (testActual.modo === "oposicion") {

      if (pregunta.respuestaSeleccionada === indice) {

        copiaPreguntas[indicePregunta] = {
          ...pregunta,
          respuestaSeleccionada: null
        };

        copiaTest.preguntas = copiaPreguntas;
        setTestActual(copiaTest);
        return;
      }
    }

    copiaPreguntas[indicePregunta] = {
      ...pregunta,
      respuestaSeleccionada: indice
    };

    copiaTest.preguntas = copiaPreguntas;
    setTestActual(copiaTest);

    if (pregunta.respuestas[indice].correcta) {
      setAciertos(prev => prev + 1);
    }
  }

  function siguientePregunta() {
    const siguiente = indicePregunta + 1;

    // 🚫 En modo práctica obligamos a responder antes de avanzar
    if (
      (testActual?.modo === "practica" || testActual?.modo === "rapido") &&
      testActual.preguntas[indicePregunta].respuestaSeleccionada === null
    ) {
      return;
    }

    // 🔎 Si estamos en revisión
    if (preguntasRevision) {
      if (siguiente < preguntasRevision.length) {
        setIndicePregunta(siguiente);
        setPreguntaActual(preguntasRevision[siguiente]);
      }
      return;
    }

    // 🧪 Si estamos haciendo el test normal
    if (siguiente < preguntasTest.length) {
      setIndicePregunta(siguiente);
      setPreguntaActual(preguntasTest[siguiente]);

    } else {

      // 🔵 En modo oposición NO finalizamos automáticamente
      if (testActual?.modo === "oposicion" || testActual?.modo === "rapido") {
        return;
      }

      // 🟡 En los demás modos sí finalizamos
      const testFinal = {
        ...testActual,
        finalizado: true,
        revisando: false,
        fechaFin: Date.now()
      };

      const todasRespondidas = testFinal.preguntas.every(
        p => p.respuestaSeleccionada !== null
      );

      if (todasRespondidas) {
        if (testFinal.tipoGuardado === "repaso") {
          actualizarProgresoRepaso(testFinal);

          setPreguntasTest([]);
          setTestActual(null);
          setIndicePregunta(0);
          setPreguntaActual(null);
          setAciertos(0);
          setPreguntasRevision(null);
          setModoFavoritas(false);
          setPantalla("home");
          return;
        }

        guardarHistoricoTest(testFinal);
      }

      setTestActual(testFinal);
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

    const idsRecientes = [
      ...getIdsRecientes(),
      ...getPreguntasUsadasSemana()
    ];


    let disponibles = filtradas.filter(
      p => !idsRecientes.includes(p.id)
    );


    if (disponibles.length < 20) {
      disponibles = filtradas;
    }

    const seleccionadas = seleccionarPreguntasEquilibradas(disponibles, 20);

    guardarTestReciente(seleccionadas);
    seleccionadas.forEach(p => registrarPreguntaUsada(p.id));
    registrarPreguntasPorTema(seleccionadas);

    const nuevoTest = {
      modo: modoTest,
      fechaInicio: Date.now(),
      preguntas: seleccionadas.map(p => ({
        ...p,
        respuestaSeleccionada: null,
        marcadaFavorita: false
      })),
      finalizado: false,
      fechaFin: null
    };

    setTestActual(nuevoTest);

    setPreguntasTest(nuevoTest.preguntas);
    setIndicePregunta(0);
    setPreguntaActual(nuevoTest.preguntas[0]);
    setAciertos(0);
    setPreguntasRevision(null);
    setPantalla("pregunta");

  }

  function iniciarTestAleatorio() {
    let filtradas = preguntas;

    if (tipoTest !== "mixto") {
      filtradas = preguntas.filter(
        p => p.categoria === tipoTest && temasActivos.includes(p.tema)
      );
    } else {
      filtradas = preguntas.filter(p => temasActivos.includes(p.tema));
    }

    const idsRecientes = [
      ...getIdsRecientes(),
      ...getPreguntasUsadasSemana()
    ];

    let disponibles = filtradas.filter(
      p => !idsRecientes.includes(p.id)
    );

    if (disponibles.length < 20) {
      disponibles = filtradas;
    }

    const seleccionadas = seleccionarPreguntasEquilibradas(disponibles, 20);

    guardarTestReciente(seleccionadas);
    seleccionadas.forEach(p => registrarPreguntaUsada(p.id));
    registrarPreguntasPorTema(seleccionadas);

    const nuevoTest = {
      modo: modoTest,
      fechaInicio: Date.now(),
      preguntas: seleccionadas.map(p => ({
        ...p,
        respuestaSeleccionada: null,
        marcadaFavorita: false
      })),
      finalizado: false,
      fechaFin: null
    };

    setTestActual(nuevoTest);

    setPreguntasTest(nuevoTest.preguntas);
    setIndicePregunta(0);
    setPreguntaActual(nuevoTest.preguntas[0]);
    setAciertos(0);
    setPreguntasRevision(null);
    setPantalla("pregunta");
  }

  function empezarOposicion() {

    const total = 50;

    const numJuridico = Math.round((configOposicion / 100) * total);
    const numEspecifico = total - numJuridico;

    const juridico = preguntas.filter(
      p => p.categoria === "jurídico" && temasActivos.includes(p.tema)
    );
    const especifico = preguntas.filter(
      p => p.categoria === "específico" && temasActivos.includes(p.tema)
    );

    const seleccionBase = [
      ...seleccionarPreguntasEquilibradas(juridico, numJuridico),
      ...seleccionarPreguntasEquilibradas(especifico, numEspecifico)
    ];

    const idsRecientes = [
      ...getIdsRecientes(),
      ...getPreguntasUsadasSemana()
    ];

    let disponibles = seleccionBase.filter(
      p => !idsRecientes.includes(p.id)
    );

    if (disponibles.length < 50) {
      disponibles = seleccionBase;
    }

    const final = barajarConEquilibrioPorTema(disponibles);

    guardarTestReciente(final);
    final.forEach(p => registrarPreguntaUsada(p.id));
    registrarPreguntasPorTema(final);

    const nuevoTest = {
      modo: "oposicion",
      penalizacion: penalizacionOposicion,
      fechaInicio: Date.now(),
      preguntas: final.map(p => ({
        ...p,
        respuestaSeleccionada: null
      })),
      finalizado: false,
      fechaFin: null
    };

    setTestActual(nuevoTest);
    setPreguntasTest(nuevoTest.preguntas);
    setIndicePregunta(0);
    setPreguntaActual(nuevoTest.preguntas[0]);
    setPreguntasRevision(null);
    setPantalla("pregunta");
  }

  function empezarModoRapido() {
    const juridicoBase = preguntas.filter(
      p => p.categoria === "jurídico" && temasActivos.includes(p.tema)
    );
    const especificoBase = preguntas.filter(
      p => p.categoria === "específico" && temasActivos.includes(p.tema)
    );

    const idsRecientes = [
      ...getIdsRecientes(),
      ...getPreguntasUsadasSemana()
    ];

    let juridico = juridicoBase.filter(p => !idsRecientes.includes(p.id));
    let especifico = especificoBase.filter(p => !idsRecientes.includes(p.id));

    if (juridico.length === 0) {
      juridico = juridicoBase;
    }

    if (especifico.length === 0) {
      especifico = especificoBase;
    }

    juridico = barajarConEquilibrioPorTema(juridico);
    especifico = barajarConEquilibrioPorTema(especifico);

    const totalPares = Math.min(juridico.length, especifico.length);
    const alternadas = [];

    for (let i = 0; i < totalPares; i++) {
      alternadas.push({
        ...juridico[i],
        respuestaSeleccionada: null
      });
      alternadas.push({
        ...especifico[i],
        respuestaSeleccionada: null
      });
    }

    if (alternadas.length === 0) {
      alert("No hay suficientes preguntas activas para iniciar el modo rápido.");
      return;
    }

    const nuevoTest = {
      modo: "rapido",
      nombreExamen: getNombreFlash(),
      fechaInicio: Date.now(),
      preguntas: alternadas,
      finalizado: false,
      fechaFin: null
    };

    setTestActual(nuevoTest);
    setPreguntasTest(nuevoTest.preguntas);
    setIndicePregunta(0);
    setPreguntaActual(nuevoTest.preguntas[0]);
    setPreguntasRevision(null);
    setAciertos(0);
    setPantalla("pregunta");
  }

  function explicarConIA() {

    const pregunta = preguntaActual.texto;

    const respuestas = preguntaActual.respuestas
      .map((r, i) => `${String.fromCharCode(65 + i)}. ${r.texto}`)
      .join("\n");

    const correcta = preguntaActual.respuestas.find(r => r.correcta)?.texto;

    const prompt = `
  Explica esta pregunta tipo test de una oposición.

  Tema: ${preguntaActual.descripcionTema}

  Pregunta:
  ${pregunta}

  Opciones:
  ${respuestas}

  Respuesta correcta:
  ${correcta}

  Evalua si la respuesta correcta es esa y en caso afirmativo explica:
  1. El concepto clave.
  2. Por qué la respuesta correcta es correcta.
  3. Por qué las otras respuestas son incorrectas.
  4. Un truco para recordarlo en examen.
  `;

    const url = `https://chatgpt.com//?q=${encodeURIComponent(prompt)}`;

    window.open(url, "_blank");
  }

  function exportarDatos() {

    const claves = [
      "preguntasFavoritas",
      "historicoTests",
      "historicoIdCounter",
      "testsRecientes",
      "preguntasUsadas",
      "preguntasPorTema",
      "repasoPendientes",
      "repasoAciertos",
      "pomodoroStats",
      "pomodoroConfig",
      "pomodoroActive"
    ];

    const backup = {};

    claves.forEach(k => {
      const valor = localStorage.getItem(k);
      if (valor !== null) {
        backup[k] = JSON.parse(valor);
      }
    });

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    const fecha = new Date().toISOString().slice(0,10);
    a.download = `backup-oposicion-${fecha}.json`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function importarDatos(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {

      try {

        const datos = JSON.parse(e.target.result);

        Object.entries(datos).forEach(([clave, valor]) => {
          localStorage.setItem(clave, JSON.stringify(valor));
        });

        alert("Datos importados correctamente. La app se recargará.");

        window.location.reload();

      } catch {
        alert("El archivo no es válido.");
      }

    };

    reader.readAsText(file);
  }

  function borrarFavoritas() {

    const confirmar = window.confirm(
      "¿Seguro que quieres borrar todas las preguntas favoritas?"
    );

    if (!confirmar) return;

    localStorage.removeItem("preguntasFavoritas");

    alert("Favoritas eliminadas.");
  }

  function reiniciarRepeticion() {

    const confirmar = window.confirm(
      "Esto permitirá que vuelvan a aparecer preguntas recientes. ¿Continuar?"
    );

    if (!confirmar) return;

    localStorage.removeItem("testsRecientes");
    localStorage.removeItem("preguntasUsadas");

    alert("Control de repetición reiniciado.");
  }

  function borrarRepaso() {
    const confirmar = window.confirm(
      "¿Seguro que quieres borrar todas las preguntas de repaso?"
    );

    if (!confirmar) return;

    localStorage.removeItem("repasoPendientes");
    localStorage.removeItem("repasoAciertos");

    setRepasoPendientes([]);
    setRepasoAciertos({});

    alert("Preguntas de repaso eliminadas.");
  }

  function iniciarTestDesdeLista(nombreExamen) {

    let seleccionadas = preguntas
      .filter(p => p.nombreExamen === nombreExamen)
      .sort(
        (a, b) =>
          Number(a.numeroPreguntaExamen) -
          Number(b.numeroPreguntaExamen)
      );

    const nuevoTest = {
      modo: modoTest, // 👈 clave: usa el modo actual
      nombreExamen,
      fechaInicio: Date.now(),
      preguntas: seleccionadas.map(p => ({
        ...p,
        respuestaSeleccionada: null
      })),
      finalizado: false,
      fechaFin: null
    };

    setTestActual(nuevoTest);

    setPreguntasTest(nuevoTest.preguntas);
    setIndicePregunta(0);
    setPreguntaActual(nuevoTest.preguntas[0]);
    setAciertos(0);
    setPreguntasRevision(null);

    setPantalla("pregunta");
  }

  const totalRepasoDisponible = repasoPendientes.filter(id =>
    preguntas.some(p => p.id === id)
  ).length;

  const preguntaSegura =
    preguntasActivas && preguntasActivas.length > 0
      ? preguntasActivas[
          Math.min(indicePregunta, preguntasActivas.length - 1)
        ]
      : null;

  return (

    <div
      style={{
        padding: pantalla === "pregunta" ? 0 : 20,
        minHeight: "100dvh",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column"
      }}
    >

    {/* HOME */}
    {pantalla === "home" && (
      <>
        <h1>Mi app</h1>

        {totalPreguntas > 0 && (
          <p>📊 Preguntas disponibles: {totalPreguntas}</p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridAutoRows: "1fr",
            gap: 20,
            marginTop: 15
          }}
        >

          {/* ESTADISTICAS */}
          <div
            onClick={() => setPantalla("estadisticas")}
            style={cardStyle}
          >
            <h2 style={cardNumberStyle}>
              {getTestsSemanaActual()}
            </h2>
            <p style={cardTextStyle}>
              Test esta semana
            </p>
          </div>
          
          {/* HACER TEST */}
          <div
            onClick={() => setPantalla("modo")}
            style={cardStyle}
          >
            <div style={{ fontSize: 40 }}>📝</div>
            <p style={cardTextStyle}>Hacer test</p>
          </div>

          {/* FAVORITAS */}
          <div
            onClick={() => {
              const favoritasIds = getFavoritas();
              const favoritas = preguntas.filter(p =>
                favoritasIds.includes(p.id)
              );

              if (favoritas.length === 0) {
                alert("No tienes preguntas favoritas aún.");
                return;
              }

              setPreguntasRevision(favoritas);
              setModoFavoritas(true);
              setIndicePregunta(0);
              setPreguntaActual(favoritas[0]);
              setPantalla("pregunta");
            }}
            style={cardStyle}
          >
            <div style={{ fontSize: 40 }}>⭐</div>
            <p style={cardTextStyle}>Favoritas</p>
          </div>
          
          {/* REPASO */}
          <div
            onClick={() => iniciarTestRepaso()}
            style={cardStyle}
          >
            <div style={{ fontSize: 40 }}>🧠</div>
            <p style={cardTextStyle}>Repaso</p>
          </div>

          {/* POMODORO */}
          <div
            onClick={() => setPantalla("pomodoro")}
            style={cardStyle}
          >
            <div style={{ fontSize: 40 }}>🍅</div>
            <p style={cardTextStyle}>Estudiar</p>
          </div>

          {/* SETTINGS */}
          <div
            onClick={() => setPantalla("settings")}
            style={cardStyle}
          >
            <div style={{ fontSize: 40 }}>⚙️</div>
            <p style={cardTextStyle}>Ajustes</p>
          </div>

        </div>

        <div style={{ marginTop: 60 }}>
          <hr
            style={{
              border: "none",
              height: 1,
              background: "rgba(255,255,255,0.2)",
              marginBottom: 20
            }}
          />
          <p style={{ opacity: 0.6, fontSize: 14, margin: 0 }}>
            Versión {version}
          </p>
        </div>

      </>
    )}
    
    {/* ESTADISTICAS */}
    {pantalla === "estadisticas" && (
      <>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            padding: 20,
            boxSizing: "border-box"
          }}
        >

          <h2>Estadísticas</h2>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
            }}
          >

            {getDatosEstadisticas().length === 0 ? (
              <p>No hay datos suficientes aún.</p>
            ) : (
              <div style={{ marginTop: 20, width: "100%", height: 260 }}>

                <div
                  style={{
                    overflowX: "auto",
                    paddingBottom: 10
                  }}
                >

                  <ResponsiveContainer
                    width={getDatosEstadisticas().length * 70}
                    height={230}
                  >
                    <LineChart
                      data={getDatosEstadisticas()}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >

                      <CartesianGrid strokeDasharray="3 3" />

                      <XAxis
                        dataKey="semana"
                        interval={0}
                        padding={{ left: 15, right: 25 }}
                        height={50}
                        tick={(props) => {
                          const { x, y, payload } = props;

                          const datos = getDatosEstadisticas().find(
                            d => d.semana === payload.value
                          );

                          return (
                            <g transform={`translate(${x},${y})`}>

                              {/* valores */}
                              <text
                                x={0}
                                y={30}
                                textAnchor="middle"
                                fill="#10b981"
                                fontSize={12}
                              >
                                E: {datos?.especifico ?? "-"}
                              </text>

                              <text
                                x={0}
                                y={44}
                                textAnchor="middle"
                                fill="#3b82f6"
                                fontSize={12}
                              >
                                J: {datos?.juridico ?? "-"}
                              </text>

                              {/* semana */}
                              <text
                                x={0}
                                y={14}
                                textAnchor="middle"
                                fill="#9ca3af"
                                fontSize={12}
                              >
                                {payload.value}
                              </text>

                            </g>
                          );
                        }}
                      />

                      <YAxis domain={[0, 100]} width={35} />

                      <Legend
                        verticalAlign="top"
                        align="center"
                        wrapperStyle={{ paddingBottom: 0 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="juridico"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        name="Jurídico"
                        dot={{ r: 4 }}
                      />

                      <Line
                        type="monotone"
                        dataKey="especifico"
                        stroke="#10b981"
                        strokeWidth={3}
                        name="Específico"
                        dot={{ r: 4 }}
                      />

                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <br />

            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 20 }}>Histórico semanal</h3>

              {(() => {
                const semanas = getSemanasOrdenadas();
                const maxTests = Math.max(...semanas.map(s => s.total), 1);

                return semanas.map((item, index) => (
                  <div key={index} style={{ marginBottom: 24 }}>

                    <div
                      onClick={() =>
                        setSemanaAbierta(
                          semanaAbierta === item.semana ? null : item.semana
                        )
                      }
                      style={{
                        display: "grid",
                        gridTemplateColumns: "70px 40px 1fr",
                        alignItems: "center",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {item.semana}
                      </div>

                      <div>
                        {item.total}
                      </div>

                      <div style={{ paddingLeft: 10, paddingRight: 10 }}>
                        <div
                          style={{
                            height: 24,
                            width: `${(item.total / maxTests) * 100}%`,
                            minWidth: 8,
                            background: "linear-gradient(90deg, #4f46e5, #3b82f6)",
                            borderRadius: 12
                          }}
                        />
                      </div>
                    </div>

                    {semanaAbierta === item.semana && (
                      <div style={{ marginLeft: 70, marginTop: 12 }}>
                        {historico
                          .filter(h => {
                            const { year, week } = getYearWeek(h.fecha);
                            const clave = `${String(year).slice(-2)}w${week}`;
                            return clave === item.semana;
                          })
                          .map(h => (
                            <div
                              key={h.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginBottom: 10,
                                padding: "6px 0",
                                borderBottom: "1px solid rgba(255,255,255,0.08)"
                              }}
                            >
                              <div style={{ color: "#d1d5db", fontSize: 14 }}>
                                {h.modo === "rapido" ? (
                                  <>
                                    <div>
                                      {new Date(h.fecha).toLocaleDateString()} · rápido
                                    </div>
                                    <div>
                                      {h.porcentajeJuridico !== null ? `J${h.porcentajeJuridico}%` : ""}
                                      {h.porcentajeJuridico !== null && h.porcentajeEspecifico !== null ? " · " : ""}
                                      {h.porcentajeEspecifico !== null ? `E${h.porcentajeEspecifico}%` : ""}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div>
                                      {new Date(h.fecha).toLocaleDateString()} · {h.modo}
                                      {h.nombreExamen ? ` · ${h.nombreExamen}` : ""}
                                    </div>

                                    <div>
                                      {(h.modo === "oposicion") ? (
                                        <>
                                          {h.nota !== null ? h.nota.toFixed(2) : "-"} · ✔ {h.aciertos ?? 0} · ✖ {h.fallos ?? 0}
                                        </>
                                      ) : (
                                        <>
                                          J: {h.porcentajeJuridico ?? "-"}% · E: {h.porcentajeEspecifico ?? "-"}%
                                        </>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>

                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  borrarTest(h.id);
                                }}
                                style={{
                                  cursor: "pointer",
                                  opacity: 0.6,
                                  fontSize: 16
                                }}
                              >
                                🗑
                              </span>
                            </div>
                          ))}
                      </div>
                    )}

                  </div>
                ));
              })()}
            </div>

          </div>

          <button
            onClick={() => setPantalla("home")}
            style={{
              marginTop: 10,
              padding: 12
            }}
          >
            Volver
          </button>
        </div>
      </>
    )}

    {/* SELECCIÓN DE MODO */}
    {pantalla === "modo" && (
      <>
        <h2>Selecciona modo</h2>

        <button onClick={() => {
          setModoTest("practica");
          setPantalla("tipo");
        }}>
          🟢 Modo práctica
        </button>

        <br /><br />

        <button onClick={() => {
          setModoTest("rapido");
          empezarModoRapido();
        }}>
          🟡 Modo rapido
        </button>

        <br /><br />

        <button onClick={() => {
          setModoTest("oposicion");
          setPantalla("config-oposicion");
        }}>
          🔵 Modo oposición
        </button>

        <br /><br />

        <button onClick={() => setPantalla("home")}>
          Volver
        </button>
      </>
    )}

    {/* CONFIGURACIÓN OPOSICIÓN */}
    {pantalla === "config-oposicion" && (
      <>
        <h2>Configurar reparto oposición</h2>

        <div style={{ marginTop: 30 }}>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Jurídico: {configOposicion}%</span>
            <span>Específico: {100 - configOposicion}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={configOposicion}
            onChange={(e) => setConfigOposicion(Number(e.target.value))}
            style={{ width: "100%", marginTop: 20 }}
          />

        </div>

        <div style={{ marginTop: 30 }}>
          <label>
            Cada fallo resta 1/
            <input
              type="number"
              min="1"
              value={penalizacionOposicion}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!isNaN(val) && val > 0) {
                  setPenalizacionOposicion(val);
                }
              }}
              style={{
                width: 60,
                marginLeft: 8,
                marginRight: 8,
                padding: "6px 8px",
                fontSize: 16,
                borderRadius: 6
              }}
            />
            de una acertada
          </label>
        </div>

        <br /><br />

        <button onClick={() => empezarOposicion()}>
          Empezar oposición (50 preguntas)
        </button>

        <br /><br />

        <button onClick={() => setPantalla("elegir-test")}>
          📋 Elegir test
        </button>

        <br /><br />

        <button onClick={() => setPantalla("modo")}>
          Volver
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

        <button onClick={() => setPantalla("elegir-test")}>
          📋 Elegir test
        </button>
        <br /><br />

        <button onClick={() => setPantalla("modo")}>
          Volver
        </button>
      </>
    )}

    {/* ELEGIR TEST */}
    {pantalla === "elegir-test" && (
      <>
        <h2>Selecciona un test</h2>

        {(() => {

          // Obtener tests únicos
          const testsUnicos = Array.from(
            new Set(preguntas.map(p => p.nombreExamen))
          ).sort();

          return testsUnicos.map((nombre, i) => {

            const total = preguntas.filter(p => p.nombreExamen === nombre).length;

            return (
              <div
                key={i}
                onClick={() => iniciarTestDesdeLista(nombre)}
                style={{
                  padding: 12,
                  marginBottom: 10,
                  borderRadius: 8,
                  background: "#1f2937",
                  color: "white",
                  cursor: "pointer"
                }}
              >
                <div style={{ fontWeight: "bold" }}>{nombre}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                  {total} preguntas
                </div>
              </div>
            );
          });

        })()}

        <br />

        <button onClick={() => setPantalla(modoTest === "oposicion" ? "config-oposicion" : "tipo")}>
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
    {pantalla === "pregunta" && preguntaSegura && (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          padding: 20,
          boxSizing: "border-box"
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <h2 style={{ marginBottom: 4 }}>
            {(() => {
              const total = testActual?.preguntas.length || 0;

              const juridico = testActual?.preguntas.filter(
                p => p.categoria === "jurídico"
              ).length || 0;

              const especifico = testActual?.preguntas.filter(
                p => p.categoria === "específico"
              ).length || 0;

              if (juridico === total && total > 0) return "Jurídico";
              if (especifico === total && total > 0) return "Específico";

              return "Mixto";
            })()}
          </h2>

          <button

            onClick={() => {
              if (modoFavoritas) {
                setModoFavoritas(false);
                setPreguntasRevision(null);
                setPreguntasTest([]);
                setTestActual(null);
                setIndicePregunta(0);
                setPreguntaActual(null);
                setPantalla("home");
                return;
              }


              if (testActual?.revisando) {
                setPreguntasRevision(null);
                setIndicePregunta(0);
                setPreguntaActual(null);
                setPantalla("resumen");
                return;
              }

              if (testActual?.modo === "rapido") {
                const testFinal = {
                  ...testActual,
                  finalizado: true,
                  revisando: false,
                  fechaFin: Date.now()
                };

                guardarHistoricoTest(testFinal);
                setTestActual(testFinal);
                setPantalla("resumen");
                return;
              }

              const esUltima = indicePregunta === preguntasActivas.length - 1;

              // 🛑 Si NO es la última → salir sin guardar
              if (!esUltima) {
                setPreguntasTest([]);
                setTestActual(null);
                setIndicePregunta(0);
                setPreguntaActual(null);
                setPantalla(
                  testActual?.tipoGuardado === "repaso" ? "home" : "modo"
                );
                return;
              }


              const testFinal = {
                ...testActual,
                finalizado: true,
                revisando: false,
                fechaFin: Date.now()
              };

              if (testFinal.tipoGuardado === "repaso") {
                actualizarProgresoRepaso(testFinal);

                setPreguntasTest([]);
                setTestActual(null);
                setIndicePregunta(0);
                setPreguntaActual(null);
                setAciertos(0);
                setPreguntasRevision(null);
                setModoFavoritas(false);
                setPantalla("home");
                return;
              }

              guardarHistoricoTest(testFinal);

              setTestActual(testFinal);
              setPantalla("resumen");
            }}
          >
            {modoFavoritas
              ? "Salir"
              : testActual?.revisando
                ? "Salir"
                : testActual?.modo === "rapido"
                  ? "Finalizar test"
                  : indicePregunta === preguntasActivas.length - 1
                    ? "Finalizar test"
                    : "Salir"}
          </button>


          <button
            onClick={() => toggleFavorita(preguntaActual.id)}
            style={{
              marginRight: 10,
              backgroundColor: esFavorita(preguntaActual.id)
                ? "#ffd700"
                : "white"
            }}
          >
            ⭐
          </button>

        </div>

        <p style={{ fontSize: 14, opacity: 0.8, marginTop: 0 }}>
          {preguntaSegura.descripcionTema}
        </p>

        <p style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
          {preguntaSegura.nombreExamen} - Nº {preguntaSegura.numeroPreguntaExamen}
        </p>

        <p>
          {testActual?.modo === "rapido"
            ? `Pregunta ${getNumeroPreguntaRapidaActual()}`
            : `Pregunta ${indicePregunta + 1} / ${preguntasActivas.length}`}
        </p>

        <div
          style={{
            flex: 1,
            overflowY: "auto",
            marginTop: 20,
            paddingRight: 5
          }}
        >

        <h3>{preguntaSegura.texto}</h3>
      
        {modoFavoritas ? (
          preguntaSegura.respuestas.map((r, i) => (
            <div
              key={i}
              style={{
                padding: 12,
                marginBottom: 8,
                backgroundColor: r.correcta ? "lightgreen" : "white",
                borderRadius: 6,
                color: "black"
              }}
            >
              {r.texto}
            </div>
          ))
        ) : (
          preguntaSegura.respuestas.map((r, i) => (
            <button
              key={i}
              onClick={() => responder(i)}
              style={{
                display: "block",
                width: "100%",
                marginBottom: 8,
                padding: 10,
                backgroundColor: (() => {
                  const seleccionada =
                    testActual?.preguntas[indicePregunta]?.respuestaSeleccionada;

                  if (testActual.modo === "practica" || testActual.modo === "rapido") {
                    if (seleccionada === null) return "white";
                    if (i === seleccionada) {
                      return r.correcta ? "lightgreen" : "salmon";
                    }
                    return r.correcta ? "lightgreen" : "white";
                  }

                  if (!testActual.revisando) {
                    if (seleccionada === null) return "white";
                    return i === seleccionada ? "#cce5ff" : "white";
                  }

                  if (testActual.modo === "oposicion") {
                    if (!testActual.revisando) {
                      if (seleccionada === null) return "white";
                      return i === seleccionada ? "#cce5ff" : "white";
                    }

                    if (seleccionada === null) {
                      return r.correcta ? "#166534" : "white";
                    }

                    if (i === seleccionada) {
                      return r.correcta ? "lightgreen" : "salmon";
                    }

                    return r.correcta ? "lightgreen" : "white";
                  }

                  return "white";
                })(),
                color: "black"
              }}
            >
              {r.texto}
            </button>
          ))
        )}

        </div>

        {(
          (
            (testActual?.modo === "practica" || testActual?.modo === "rapido") &&
            testActual?.preguntas[indicePregunta]?.respuestaSeleccionada !== null
          )
          ||
          testActual?.revisando
        ) && (

          <button
            onClick={explicarConIA}
            style={{
              marginTop: 12,
              padding: 12,
              width: "100%",
              backgroundColor: "#6366f1",
              color: "white",
              borderRadius: 6
            }}
          >
            🤖 Explicar pregunta con IA
          </button>

        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 30
          }}
        >
          {desdeRepaso ? (

            <button
              onClick={() => {
                setDesdeRepaso(false);
                setPantalla("repaso-oposicion");
              }}
            >
              Volver a pantalla de repaso
            </button>

          ) : (

            <>
              {/* IZQUIERDA */}
              {indicePregunta > 0 && (
                <button
                  onClick={() => {
                    const anterior = indicePregunta - 1;
                    setIndicePregunta(anterior);
                    if (preguntasRevision) {
                      setPreguntaActual(preguntasRevision[anterior]);
                    } else {
                      setPreguntaActual(preguntasTest[anterior]);
                    }
                  }}
                >
                  Anterior
                </button>
              )}

              {/* DERECHA */}
              <div style={{ marginLeft: "auto" }}>
                {testActual?.modo === "oposicion" ? (

                  indicePregunta < preguntasActivas.length - 1 ? (
                    <button onClick={siguientePregunta}>
                      Siguiente pregunta
                    </button>
                  ) : (
                    <button onClick={() => setPantalla("repaso-oposicion")}>
                      Repasar preguntas
                    </button>
                  )

                ) : testActual?.modo === "rapido" ? (

                  indicePregunta < preguntasActivas.length - 1 && (
                    <button onClick={siguientePregunta}>
                      Siguiente pregunta
                    </button>
                  )

                ) : (

                  indicePregunta < preguntasActivas.length - 1 && (
                    <button onClick={siguientePregunta}>
                      Siguiente pregunta
                    </button>
                  )

                )}
              </div>
            </>

          )}
        </div>


        </div>
      
    )}

    {/* REPASO OPOSICIÓN */}
    {pantalla === "repaso-oposicion" && (
      <>
        <h2>Repasar preguntas</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, 1fr)",
            gap: 10,
            marginTop: 30
          }}
        >
          {testActual.preguntas.map((p, i) => {

            const respondida = p.respuestaSeleccionada !== null;

            return (
              <button
                key={i}
                onClick={() => {
                  setIndicePregunta(i);
                  setPreguntaActual(testActual.preguntas[i]);
                  setDesdeRepaso(true);
                  setPantalla("pregunta");
                }}

                style={{
                  padding: 12,
                  fontWeight: "bold",
                  backgroundColor: respondida ? "#3b82f6" : "white",
                  color: respondida ? "white" : "black",
                  borderRadius: 6
                }}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <div
          style={{
            marginTop: 40,
            display: "flex",
            justifyContent: "space-between"
          }}
        >
          <button onClick={() => setPantalla("pregunta")}>
            Volver al examen
          </button>

          <button
            onClick={() => {

              const testFinal = {
                ...testActual,
                finalizado: true,
                revisando: false,
                fechaFin: Date.now()
              };

              guardarHistoricoTest(testFinal);

              setTestActual(testFinal);
              setPantalla("resumen");
            }}
          >
            Finalizar test
          </button>
        </div>
      </>
    )}

    {/* RESUMEN */}
    {pantalla === "resumen" && (
      <>
        <h2>Resumen del test</h2>

        {(() => {
          let total = testActual?.preguntas.length || 0;
          let aciertosFinal = 0;
          let correctas = 0;
          let incorrectas = 0;
          const respondidas = testActual?.preguntas.filter(
            p => p.respuestaSeleccionada !== null
          ).length || 0;

          if (testActual?.modo === "oposicion") {

            testActual.preguntas.forEach(p => {
              if (p.respuestaSeleccionada !== null) {
                if (p.respuestas[p.respuestaSeleccionada]?.correcta) {
                  correctas++;
                } else {
                  incorrectas++;
                }
              }
            });

            const divisor = testActual.penalizacion || 3;
            const neta = Math.max(0, correctas - incorrectas / divisor);
            const nota = total > 0 ? (neta / total) * 10 : 0;

            return (
              <>
                <p>Correctas: {correctas}</p>
                <p>Incorrectas: {incorrectas}</p>
                <p>En blanco: {total - correctas - incorrectas}</p>

                <h3>
                  Nota final: {nota.toFixed(2)} / 10
                </h3>
              </>
            );
          }

          if (testActual?.modo === "practica") {
            aciertosFinal = aciertos;
          } else {
            aciertosFinal = testActual?.preguntas.filter(
              p =>
                p.respuestaSeleccionada !== null &&
                p.respuestas[p.respuestaSeleccionada]?.correcta
            ).length;
          }

          const fallosFinal = respondidas - aciertosFinal;

          if (testActual?.modo === "rapido") {
            const porcentajeAciertos = respondidas > 0
              ? Math.round((aciertosFinal / respondidas) * 100)
              : 0;

            return (
              <>
                <p>
                  Acertadas {aciertosFinal} de {respondidas} preguntas
                </p>

                <p>
                  Porcentaje de aciertos {porcentajeAciertos}%
                </p>

                <p>
                  {porcentajeAciertos >= 80
                    ? "Excelente resultado 💪"
                    : porcentajeAciertos >= 60
                    ? "Buen resultado 👍"
                    : "Conviene repasar 📘"}
                </p>
              </>
            );
          }

          return (
            <>
              <p>
                Acertadas {aciertosFinal} de {total} preguntas
              </p>

              <p>
                Porcentaje de aciertos{" "}
                {total > 0
                  ? Math.round((aciertosFinal / total) * 100)
                  : 0}
                %
              </p>

              <p>
                {total > 0 &&
                Math.round((aciertosFinal / total) * 100) >= 80
                  ? "Excelente resultado 💪"
                  : total > 0 &&
                    Math.round((aciertosFinal / total) * 100) >= 60
                  ? "Buen resultado 👍"
                  : "Conviene repasar 📘"}
              </p>
            </>
          );
        })()}

        <br />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 30,
            width: "100%"
          }}
        >

          {/* IZQUIERDA - Salir */}
          <div>
            <button
              onClick={() => {
                if (testActual?.tipoGuardado === "repaso") {
                  setPantalla("home");
                } else if (testActual?.modo === "rapido") {
                  setPantalla("modo");
                } else {
                  setPantalla("tipo");
                }

                setPreguntasTest([]);
                setTestActual(null);
                setIndicePregunta(0);
                setPreguntaActual(null);
                setAciertos(0);
                setPreguntasRevision(null);
                setModoFavoritas(false);
              }}
            >
              Salir
            </button>
          </div>

          {/* DERECHA - Acción */}
          {testActual?.modo === "practica" && testActual?.tipoGuardado !== "repaso" ? (
            <div>
              <button
                onClick={() => {
                  const pendientes = testActual.preguntas.filter(p =>
                    p.respuestaSeleccionada === null ||
                    !p.respuestas[p.respuestaSeleccionada]?.correcta
                  );

                  if (pendientes.length === 0) {
                    alert("No hay preguntas falladas para repasar.");
                    return;
                  }

                  agregarPreguntasARepaso(pendientes);
                  iniciarTestRepaso(pendientes.map(p => p.id));
                }}
              >
                Repaso
              </button>
            </div>
          ) : testActual?.modo !== "rapido" ? (
            <div>
              <button
                onClick={() => {
                  const todas = testActual.preguntas;

                  let revision;

                  revision = todas;

                  setPreguntasRevision(revision);

                  setTestActual(prev => ({
                    ...prev,
                    revisando: true
                  }));

                  setIndicePregunta(0);
                  setPreguntaActual(revision[0]);
                  setPantalla("pregunta");
                }}
              >
                Revisar test
              </button>
            </div>
          ) : null}
        </div>
      </>
    )}

    {/* POMODORO */}
    {pantalla === "pomodoro" && (
      <>
        <h2>Modo Estudio 🍅</h2>

        <div style={{ marginTop: 10, marginBottom: 10 }}>

        <div style={{ marginBottom: 10 }}>
          Estudio:
          <input
            type="number"
            min="1"
            value={workDuration}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value > 0) {
                setWorkDuration(e.target.value);
              }
            }}

            style={{
              width: 70,
              marginLeft: 10,
              padding: "6px 8px",
              fontSize: 16,      // 🔥 clave anti-zoom iOS
              borderRadius: 8
            }}
          />
          <span style={{ marginLeft: 4 }}>min</span>
        </div>

        <div>
          Descanso:
          <input
            type="number"
            min="1"
            value={breakDuration}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value > 0) {
                setBreakDuration(e.target.value);
              }
            }}

            style={{
              width: 70,
              marginLeft: 10,
              padding: "6px 8px",
              fontSize: 16,      // 🔥 clave anti-zoom iOS
              borderRadius: 8
            }}
          />
          <span style={{ marginLeft: 4 }}>min</span>
        </div>

      </div>

        <div style={{ marginTop: 15, textAlign: "center" }}>

          <h3 style={{ fontSize: 24 }}>
            {pomodoroMode === "work" ? "Estudio" : "Descanso"}
          </h3>

          <div
            style={{
              fontSize: 64,
              fontWeight: "bold",
              margin: "20px 0"
            }}
          >
            {String(Math.floor(pomodoroElapsed / 60)).padStart(2, "0")}:
            {String(pomodoroElapsed % 60).padStart(2, "0")}
          </div>


          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>

            {!pomodoroRunning ? (
              <button
                onClick={iniciarPomodoro}
                style={{ padding: 12, fontSize: 18 }}
              >
                {pomodoroPaused ? "Reanudar" : "Iniciar"}
              </button>
            ) : (
              <>
                <button
                  onClick={pausarPomodoro}
                  style={{ padding: 12, fontSize: 18 }}
                >
                  Pausar
                </button>

                <button
                  onClick={terminarPomodoro}
                  style={{ padding: 12, fontSize: 18 }}
                >
                  Terminar
                </button>
              </>
            )}

          </div>

        </div>

        <div style={{ marginTop: 40 }}>
          <h3>Estadísticas</h3>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            maxWidth: 300
          }}
        >
          <p style={{ margin: 0 }}>
            Hoy:{" "}
            {pomodoroStats.byDay[new Date().toISOString().slice(0, 10)] || 0} min
          </p>

          <span
            onClick={sumarManualPomodoro}
            style={{
              cursor: "pointer",
              fontSize: 18,
              color: "#646cff",
              fontWeight: "bold"
            }}
          >
            ➕
          </span>

        </div>


          <p>
            Semana:{" "}
            {pomodoroStats.byWeek[
              `${String(getYearWeek(Date.now()).year).slice(-2)}w${getYearWeek(Date.now()).week}`
            ] || 0} min
          </p>

          {(() => {
            const total = pomodoroStats.totalMinutes;
            const horas = Math.floor(total / 60);
            const minutos = total % 60;

            return (
              <p>
                Total acumulado: {horas}h {minutos}m
              </p>
            );
          })()}
        </div>

        <br />

        <button onClick={() => setPantalla("home")}>
          Volver
        </button>
      </>
    )}

    {/* SETTINGS */}
    {pantalla === "settings" && (
      <>
        <h2>Ajustes</h2>

        <div style={{ marginTop: 30 }}>

          <button
            onClick={exportarDatos}
            style={{ padding: 12, marginBottom: 20, width: "100%" }}
          >
            💾 Exportar datos
          </button>

          <label
            style={{
              display: "block",
              padding: 12,
              background: "#6366f1",
              color: "white",
              textAlign: "center",
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            📂 Importar datos
            <input
              type="file"
              accept="application/json"
              onChange={importarDatos}
              style={{ display: "none" }}
            />
          </label>

        </div>

        <hr style={{ margin: "30px 0" }} />

        <button
          onClick={borrarFavoritas}
          style={{ padding: 12, marginBottom: 20, width: "100%" }}
        >
          🧹 Borrar favoritas
        </button>

        <button
          onClick={borrarRepaso}
          style={{ padding: 12, width: "100%" }}
        >
          🧽 Borrar preguntas de repaso
        </button>

        <hr style={{ margin: "30px 0" }} />

        <button
          onClick={reiniciarRepeticion}
          style={{ padding: 12, marginBottom: 20, width: "100%" }}
        >
          🔁 Reiniciar control de repetición
        </button>

        <button
          onClick={() => setPantalla("temario")}
          style={{ padding: 12, marginBottom: 20, width: "100%" }}
        >
          📚 Selección de temario
        </button>

        <button
          onClick={() => setPantalla("preguntas-por-tema")}
          style={{ padding: 12, marginBottom: 20, width: "100%" }}
        >
          📊 Preguntas por tema
        </button>

        <br /><br />

        <button onClick={() => setPantalla("home")}>
          Volver
        </button>
      </>
    )}

    {/* SELECCIÓN DE TEMARIO */}
    {pantalla === "temario" && (
      <>
        <h2>Selección de temario</h2>

        {(() => {

          const temasOrdenados = Array.from(
            new Map(
              preguntas.map(p => {

                // 🔥 EXTRAER NÚMERO DEL TEXTO
                const match = p.tema?.match(/^(\d+)/);
                const numero = match ? Number(match[1]) : null;

                return [
                  p.tema,
                  {
                    tema: p.tema,
                    descripcion: p.descripcionTema,
                    numero
                  }
                ];
              })
            ).values()
          ).sort((a, b) => {

            // SIN DEFINIR arriba
            if (a.numero === null && b.numero === null) return 0;
            if (a.numero === null) return -1;
            if (b.numero === null) return 1;

            return a.numero - b.numero;
          });

          return temasOrdenados.map((t, i) => (
            <label key={i} style={{ display: "block", marginBottom: 6 }}>
              <input
                type="checkbox"
                checked={temasActivos.includes(t.tema)}
                onChange={(e) => {

                  let nuevos;

                  if (e.target.checked) {
                    nuevos = [...temasActivos, t.tema];
                  } else {
                    if (temasActivos.length === 1) {
                      alert("Debe haber al menos un tema seleccionado.");
                      return;
                    }
                    nuevos = temasActivos.filter(x => x !== t.tema);
                  }

                  setTemasActivos(nuevos);
                  localStorage.setItem("temasActivos", JSON.stringify(nuevos));
                }}
              />
              {" "}
              {t.tema} - {t.descripcion}
            </label>
          ));

        })()}

        <br />

        <button onClick={() => setPantalla("settings")}>
          Volver
        </button>
      </>
    )}

    {/* PREGUNTAS POR TEMA */}
    {pantalla === "preguntas-por-tema" && (
      <>
        <h2>Preguntas preguntadas por tema</h2>

        {(() => {
          const temasOrdenados = Array.from(
            new Map(
              preguntas.map(p => {
                const match = p.tema?.match(/^(\d+)/);
                const numero = match ? Number(match[1]) : null;

                return [
                  p.tema,
                  {
                    tema: p.tema,
                    descripcion: p.descripcionTema,
                    numero
                  }
                ];
              })
            ).values()
          )
            .map(t => ({
              ...t,
              total: preguntasPorTema[t.tema] || 0
            }))
            .sort((a, b) => {
              if (b.total !== a.total) return b.total - a.total;

              if (a.numero === null && b.numero === null) {
                return String(a.tema).localeCompare(String(b.tema));
              }
              if (a.numero === null) return 1;
              if (b.numero === null) return -1;

              return a.numero - b.numero;
            });

          return (
            <div style={{ marginTop: 20, overflowX: "auto" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "90px 1fr",
                  gap: 12,
                  padding: "10px 0",
                  borderBottom: "2px solid rgba(255,255,255,0.2)",
                  fontWeight: "bold"
                }}
              >
                <div>Preguntas</div>
                <div>Tema</div>
              </div>

              {temasOrdenados.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "90px 1fr",
                    gap: 12,
                    padding: "10px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.08)"
                  }}
                >
                  <div>{t.total}</div>
                  <div>
                    {t.tema} - {t.descripcion}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        <br />

        <button onClick={() => setPantalla("settings")}>
          Volver
        </button>
      </>
    )}

    </div>
  )
}

export default App;
