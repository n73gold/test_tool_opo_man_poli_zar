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

function ScreenLayout({
  title,
  subtitle = null,
  topActions = null,
  bottomActions = null,
  children,
  maxWidth = 900
}) {
  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box",
        background: "#242424"
      }}
    >
      <div
        style={{
          flex: "0 0 auto",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          padding: "calc(14px + env(safe-area-inset-top)) clamp(12px, 4vw, 20px) 12px",
          boxSizing: "border-box",
          background: "#242424",
          backdropFilter: "blur(8px)"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                lineHeight: 1.2
              }}
            >
              {title}
            </h1>

            {subtitle && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 13,
                  opacity: 0.75,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          {topActions && (
            <div
              style={{
                flex: "0 0 auto",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              {topActions}
            </div>
          )}
        </div>
      </div>

      <main
        style={{
          width: "100%",
          maxWidth: "100%",
          flex: "1 1 auto",
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          padding: "18px clamp(12px, 4vw, 20px)",
          boxSizing: "border-box",
          background: "#242424"
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth,
            minWidth: 0,
            boxSizing: "border-box",
            margin: "0 auto"
          }}
        >
          {children}
        </div>
      </main>

      {bottomActions && (
        <div
          style={{
            flex: "0 0 auto",
            borderTop: "1px solid rgba(255,255,255,0.12)",
            padding: "12px clamp(12px, 4vw, 20px) calc(12px + env(safe-area-inset-bottom))",
            boxSizing: "border-box",
            background: "#242424",
            backdropFilter: "blur(8px)"
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth,
              margin: "0 auto",
              display: "flex",
              justifyContent: "space-between",
              gap: 12
            }}
          >
            {bottomActions}
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  const [mensaje, setMensaje] = useState("");
  const [totalPreguntas, setTotalPreguntas] = useState(0);

  function leerOposicionActivaGuardada() {
    const valor = localStorage.getItem("oposicionActiva");

    if (!valor) return null;

    try {
      const parsed = JSON.parse(valor);

      if (typeof parsed === "string" && parsed.trim()) {
        const limpio = parsed.trim();
        localStorage.setItem("oposicionActiva", limpio);
        return limpio;
      }
    } catch {
      // Si no es JSON, usamos el valor tal cual
    }

    return valor.trim();
  }

  const oposicionGuardadaInicial = leerOposicionActivaGuardada();

  const [oposicionActiva, setOposicionActiva] = useState(oposicionGuardadaInicial);

  const [pantalla, setPantalla] = useState(() => {
    return oposicionGuardadaInicial
      ? "home"
      : "selector-oposicion";
  });

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

  const [tipoFiltroTemario, setTipoFiltroTemario] = useState(null);
  const [temasFiltroTemario, setTemasFiltroTemario] = useState([]);

  const [configOposicion, setConfigOposicion] = useState(20);

  const [penalizacionOposicion, setPenalizacionOposicion] = useState(3);

  const [historico, setHistorico] = useState([]);

  const [semanaAbierta, setSemanaAbierta] = useState(null);

  const [desdeRepaso, setDesdeRepaso] = useState(false);

  const MAX_TESTS_RECIENTES = 5;
  const DIAS_SIN_REPETIR = 6;

  const version = __APP_VERSION__;

  const preguntasActivas = preguntasRevision ?? preguntasTest;

  function storageKey(nombre, codigo = oposicionActiva) {
    const clavesPorOposicion = [
      "historicoTests",
      "historicoIdCounter",
      "temasActivos"
    ];

    if (!codigo || !clavesPorOposicion.includes(nombre)) {
      return nombre;
    }

    return `${nombre}__${codigo}`;
  }

  function getTemasDeOposicion(codigo, listaPreguntas = preguntas) {
    if (!codigo) return [];

    return Array.from(
      new Set(
        listaPreguntas
          .filter(p =>
            Array.isArray(p.oposiciones) &&
            p.oposiciones.includes(codigo)
          )
          .map(p => p.tema)
          .filter(Boolean)
      )
    );
  }

  function cargarTemasActivosDeOposicion(codigo, listaPreguntas = preguntas) {
    const key = storageKey("temasActivos", codigo);
    const guardados = JSON.parse(localStorage.getItem(key) || "null");

    if (guardados && Array.isArray(guardados) && guardados.length > 0) {
      return guardados;
    }

    const temas = getTemasDeOposicion(codigo, listaPreguntas);

    if (temas.length > 0) {
      localStorage.setItem(key, JSON.stringify(temas));
    }

    return temas;
  }

  const [temasActivos, setTemasActivos] = useState([]);

  const [preguntasPorTema, setPreguntasPorTema] = useState({});

  const [rendimientoPorTema, setRendimientoPorTema] = useState({});

  const [ordenPreguntasPorTema, setOrdenPreguntasPorTema] = useState("preguntas");

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

    if (oposicionActiva) {
      setHistorico(getHistorico(oposicionActiva));
    }

    if (guardadas) {
      const data = JSON.parse(guardadas);

      setPreguntas(data);
      setTotalPreguntas(data.length);

      if (oposicionActiva) {
        setTemasActivos(
          cargarTemasActivosDeOposicion(oposicionActiva, data)
        );
      }
    }

    fetch(import.meta.env.BASE_URL + "preguntas.json")
      .then(res => res.json())
      .then(data => {
        localStorage.setItem("preguntas", JSON.stringify(data));
        setPreguntas(data);
        setTotalPreguntas(data.length);
        // Inicializar temas activos si no existen
        if (oposicionActiva) {
          setTemasActivos(
            cargarTemasActivosDeOposicion(oposicionActiva, data)
          );

          setHistorico(getHistorico(oposicionActiva));
        }
      })


      .catch(() => {
        // si no hay red, no pasa nada
      });

      if (oposicionActiva) {
        setHistorico(getHistorico(oposicionActiva));
      }

      const savedPomodoro = JSON.parse(localStorage.getItem("pomodoroStats") || "null");
      if (savedPomodoro) {
        setPomodoroStats(savedPomodoro);
      }

      const savedPreguntasPorTema = JSON.parse(
        localStorage.getItem("preguntasPorTema") || "{}"
      );
      setPreguntasPorTema(savedPreguntasPorTema);

      const savedRendimientoPorTema = JSON.parse(
        localStorage.getItem("rendimientoPorTema") || "{}"
      );
      setRendimientoPorTema(savedRendimientoPorTema);

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

  function getHistorico(codigo = oposicionActiva) {
    return JSON.parse(localStorage.getItem(storageKey("historicoTests", codigo)) || "[]");
  }

  function getNextHistoricoId(codigo = oposicionActiva) {
    const key = storageKey("historicoIdCounter", codigo);
    const current = Number(localStorage.getItem(key) || 0);
    const next = current + 1;
    localStorage.setItem(key, next);
    return next;
  }

  function guardarHistorico(lista, codigo = oposicionActiva) {
    localStorage.setItem(storageKey("historicoTests", codigo), JSON.stringify(lista));
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

    const nuevasFavoritasIds = actuales.includes(id)
      ? actuales.filter(x => x !== id)
      : [...actuales, id];

    guardarFavoritas(nuevasFavoritasIds);

    // Forzar re-render sin romper si no hay testActual
    setTestActual(prev => (prev ? { ...prev } : prev));

    // Si estamos viendo favoritas, mantenemos solo la lista actual filtrada
    if (modoFavoritas) {
      const baseActual = preguntasRevision || [];

      const nuevasFavoritas = baseActual.filter(p =>
        nuevasFavoritasIds.includes(p.id)
      );

      if (nuevasFavoritas.length === 0) {
        setModoFavoritas(false);
        setPreguntasRevision(null);
        setTipoFiltroTemario(null);
        setTemasFiltroTemario([]);
        setPantalla("home");
        return;
      }

      setPreguntasRevision(nuevasFavoritas);

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

    const limiteMs = DIAS_SIN_REPETIR * 24 * 60 * 60 * 1000;

    const vigentes = usadas
      .filter(p => p?.id && p?.fecha && ahora - p.fecha < limiteMs);

    localStorage.setItem("preguntasUsadas", JSON.stringify(vigentes));

    return vigentes.map(p => p.id);
  }

  function registrarPreguntaUsada(id) {
    if (!id) return;

    registrarPreguntasUsadas([{ id }]);
  }

  function registrarPreguntasUsadas(listaPreguntas) {
    if (!Array.isArray(listaPreguntas) || listaPreguntas.length === 0) return;

    const ahora = Date.now();
    const limiteMs = DIAS_SIN_REPETIR * 24 * 60 * 60 * 1000;

    const usadas = JSON.parse(localStorage.getItem("preguntasUsadas") || "[]")
      .filter(p => p?.id && p?.fecha && ahora - p.fecha < limiteMs);

    const idsVigentes = new Set(usadas.map(p => p.id));

    listaPreguntas.forEach(p => {
      if (!p?.id) return;

      if (!idsVigentes.has(p.id)) {
        usadas.push({
          id: p.id,
          fecha: ahora
        });

        idsVigentes.add(p.id);
      }
    });

    localStorage.setItem("preguntasUsadas", JSON.stringify(usadas));
  }

  function getIdsPreguntasBloqueadas() {
    return getPreguntasUsadasSemana();
  }

  function separarPreguntasPorRepeticion(lista) {
    const bloqueadas = new Set(getIdsPreguntasBloqueadas());

    return {
      nuevas: lista.filter(p => p.id && !bloqueadas.has(p.id)),
      repetidas: lista.filter(p => p.id && bloqueadas.has(p.id))
    };
  }

  function seleccionarPreguntasSinRepetir(lista, cantidad, maxPorTema = 3) {
    const { nuevas, repetidas } = separarPreguntasPorRepeticion(lista);

    const seleccionadasNuevas = seleccionarPreguntasEquilibradasConLimitePorTema(
      nuevas,
      cantidad,
      maxPorTema
    );

    if (seleccionadasNuevas.length >= cantidad) {
      return seleccionadasNuevas;
    }

    const idsYaSeleccionadas = new Set(
      seleccionadasNuevas.map(p => p.id)
    );

    const repetidasDisponibles = repetidas.filter(
      p => !idsYaSeleccionadas.has(p.id)
    );

    const relleno = seleccionarPreguntasEquilibradasConLimitePorTema(
      repetidasDisponibles,
      cantidad - seleccionadasNuevas.length,
      maxPorTema
    );

    return [...seleccionadasNuevas, ...relleno];
  }

  function guardarTestReciente(preguntasTest) {
    const tests = getTestsRecientes();

    const ids = preguntasTest.map(p => p.id);

    tests.push(ids);

    if (tests.length > MAX_TESTS_RECIENTES) {
      tests.shift();
    }

    localStorage.setItem("testsRecientes", JSON.stringify(tests));
  }

  function getOposicionesDisponibles() {
    return Array.from(
      new Set(
        preguntas.flatMap(p =>
          Array.isArray(p.oposiciones) ? p.oposiciones : []
        )
      )
    ).sort();
  }

  function getPreguntasOposicionActiva() {
    if (!oposicionActiva) return [];

    return preguntas.filter(p =>
      Array.isArray(p.oposiciones) &&
      p.oposiciones.includes(oposicionActiva)
    );
  }

  function seleccionarOposicion(codigo) {
    localStorage.setItem("oposicionActiva", codigo);
    setOposicionActiva(codigo);

    setHistorico(getHistorico(codigo));
    setTemasActivos(cargarTemasActivosDeOposicion(codigo, preguntas));

    setPreguntasTest([]);
    setTestActual(null);
    setIndicePregunta(0);
    setPreguntaActual(null);
    setAciertos(0);
    setPreguntasRevision(null);
    setModoFavoritas(false);
    setDesdeRepaso(false);
    setTipoFiltroTemario(null);
    setTemasFiltroTemario([]);

    setPantalla("home");
  }

  function volverASelectorOposicion() {
    setPreguntasTest([]);
    setTestActual(null);
    setIndicePregunta(0);
    setPreguntaActual(null);
    setAciertos(0);
    setPreguntasRevision(null);
    setModoFavoritas(false);
    setDesdeRepaso(false);
    setTipoFiltroTemario(null);
    setTemasFiltroTemario([]);

    setPantalla("selector-oposicion");
  }
  
  function getPreguntasCandidatasFiltroTemario(tipo = tipoFiltroTemario) {
    const basePreguntas = getPreguntasOposicionActiva();

    if (tipo === "favoritas") {
      const favoritasIds = getFavoritas();

      return basePreguntas.filter(p =>
        favoritasIds.includes(p.id)
      );
    }

    if (tipo === "repaso") {
      const pendientes = getRepasoPendientes();

      return pendientes
        .map(id => basePreguntas.find(p => p.id === id))
        .filter(Boolean);
    }

    return [];
  }

  function getTemasFiltroTemario(tipo = tipoFiltroTemario) {
    const candidatas = getPreguntasCandidatasFiltroTemario(tipo);

    const mapa = new Map();

    candidatas.forEach(p => {
      const tema = p.tema || "Sin tema";

      if (!mapa.has(tema)) {
        const match = String(tema).match(/^(\d+)/);
        const numero = match ? Number(match[1]) : null;

        mapa.set(tema, {
          tema,
          descripcion: p.descripcionTema,
          numero,
          total: 0
        });
      }

      mapa.get(tema).total += 1;
    });

    return Array.from(mapa.values()).sort((a, b) => {
      if (a.numero === null && b.numero === null) {
        return String(a.tema).localeCompare(String(b.tema));
      }

      if (a.numero === null) return 1;
      if (b.numero === null) return -1;

      return a.numero - b.numero;
    });
  }

  function abrirFiltroTemario(tipo) {
    const candidatas = getPreguntasCandidatasFiltroTemario(tipo);

    if (candidatas.length === 0) {
      alert(
        tipo === "favoritas"
          ? "No tienes preguntas favoritas aún."
          : "No hay preguntas pendientes de repaso."
      );
      return;
    }

    const temas = getTemasFiltroTemario(tipo).map(t => t.tema);

    setTipoFiltroTemario(tipo);
    setTemasFiltroTemario(temas);
    setPantalla("filtro-temario");
  }

  function iniciarDesdeFiltroTemario() {
    const candidatas = getPreguntasCandidatasFiltroTemario(tipoFiltroTemario);

    const filtradas = candidatas.filter(p =>
      temasFiltroTemario.includes(p.tema || "Sin tema")
    );

    if (filtradas.length === 0) {
      alert("No hay preguntas para los temas seleccionados.");
      return;
    }

    if (tipoFiltroTemario === "favoritas") {
      setPreguntasRevision(filtradas);
      setModoFavoritas(true);
      setIndicePregunta(0);
      setPreguntaActual(filtradas[0]);
      setPantalla("pregunta");
      return;
    }

    if (tipoFiltroTemario === "repaso") {
      const ids = filtradas.map(p => p.id);

      setTipoFiltroTemario(null);
      setTemasFiltroTemario([]);

      iniciarTestRepaso(ids);
    }
  }

  function getPreguntasPorTema() {
    return JSON.parse(localStorage.getItem("preguntasPorTema") || "{}");
  }

  function guardarPreguntasPorTema(stats) {
    localStorage.setItem("preguntasPorTema", JSON.stringify(stats));
    setPreguntasPorTema(stats);
  }

  function getRendimientoPorTema() {
    return JSON.parse(localStorage.getItem("rendimientoPorTema") || "{}");
  }

  function guardarRendimientoPorTema(stats) {
    localStorage.setItem("rendimientoPorTema", JSON.stringify(stats));
    setRendimientoPorTema(stats);
  }

  function registrarRendimientoPorTema(test, omitir = false) {
    if (omitir) return;
    if (!test?.preguntas?.length) return;

    const stats = getRendimientoPorTema();

    test.preguntas.forEach(p => {
      if (p.respuestaSeleccionada === null) return;

      const tema = p.tema || "Sin tema";
      const acertada = !!p.respuestas[p.respuestaSeleccionada]?.correcta;

      if (!stats[tema]) {
        stats[tema] = {
          respondidas: 0,
          aciertos: 0
        };
      }

      stats[tema].respondidas += 1;

      if (acertada) {
        stats[tema].aciertos += 1;
      }
    });

    guardarRendimientoPorTema(stats);
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

  function agregarFalladasDeTestARepaso(test) {
    if (!test?.preguntas?.length) return;

    let pendientes = [];

    if (test.modo === "rapido") {
      pendientes = test.preguntas.filter(
        p =>
          p.respuestaSeleccionada !== null &&
          !p.respuestas[p.respuestaSeleccionada]?.correcta
      );
    }

    if (test.modo === "oposicion") {
      pendientes = test.preguntas.filter(
        p =>
          p.respuestaSeleccionada === null ||
          !p.respuestas[p.respuestaSeleccionada]?.correcta
      );
    }

    if (pendientes.length > 0) {
      agregarPreguntasARepaso(pendientes);
    }
  }

  function iniciarTestRepaso(ids = null) {
    const idsFuente = Array.isArray(ids) ? ids : repasoPendientes;

    const idsUnicos = [...new Set(idsFuente)];

    const basePreguntas = getPreguntasOposicionActiva();

    const seleccionadas = idsUnicos
      .map(id => basePreguntas.find(p => p.id === id))
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

  function registrarPreguntasPorTema(listaPreguntas, omitirConteo = false) {
    if (omitirConteo) return;
    if (!Array.isArray(listaPreguntas) || listaPreguntas.length === 0) return;

    const respondidas = listaPreguntas.filter(
      p =>
        p.respuestaSeleccionada !== null &&
        p.respuestaSeleccionada !== undefined
    );

    if (respondidas.length === 0) return;

    const stats = getPreguntasPorTema();

    respondidas.forEach(p => {
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

  function seleccionarPreguntasEquilibradasConLimitePorTema(
    lista,
    cantidad,
    maxPorTema = 3
  ) {
    if (!Array.isArray(lista) || lista.length === 0) return [];

    const ordenadas = barajarConEquilibrioPorTema(lista);
    const seleccionadas = [];
    const contadorPorTema = {};

    // Primera pasada: respetar máximo por tema
    for (const p of ordenadas) {
      const tema = p.tema || "Sin tema";
      const usadas = contadorPorTema[tema] || 0;

      if (usadas < maxPorTema) {
        seleccionadas.push(p);
        contadorPorTema[tema] = usadas + 1;
      }

      if (seleccionadas.length === cantidad) {
        return seleccionadas;
      }
    }

    // Segunda pasada: si no llega, rellenar equilibradamente sin límite estricto
    for (const p of ordenadas) {
      if (seleccionadas.some(sel => sel.id === p.id)) continue;

      seleccionadas.push(p);

      if (seleccionadas.length === cantidad) {
        return seleccionadas;
      }
    }

    return seleccionadas;
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
      id: getNextHistoricoId(oposicionActiva),
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

    const historicoActual = getHistorico(oposicionActiva);

    const nuevoHistorico = [...historicoActual, nuevoRegistro];

    guardarHistorico(nuevoHistorico, oposicionActiva);
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

    const basePreguntas = getPreguntasOposicionActiva();

    if (basePreguntas.length === 0) {
      alert("No hay preguntas disponibles para la oposición activa.");
      return;
    }

    if (tipo === "mixto") {
      const juridico = basePreguntas.filter(
        p => p.categoria === "jurídico" && temasActivos.includes(p.tema)
      );
      const especifico = basePreguntas.filter(
        p => p.categoria === "específico" && temasActivos.includes(p.tema)
      );

      const mitad = 10;

      const seleccionBase = [
        ...seleccionarPreguntasSinRepetir(juridico, mitad, 3),
        ...seleccionarPreguntasSinRepetir(especifico, mitad, 3)
      ];

      const mezcladas = barajarConEquilibrioPorTema(seleccionBase);

      guardarTestReciente(mezcladas);
      registrarPreguntasUsadas(mezcladas);

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

    let filtradas = basePreguntas.filter(
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

        registrarPreguntasPorTema(
          testFinal.preguntas,
          !!testFinal.desdeElegirTest || testFinal.tipoGuardado === "repaso"
        );

        registrarRendimientoPorTema(
          testFinal,
          !!testFinal.desdeElegirTest || testFinal.tipoGuardado === "repaso"
        );

        guardarHistoricoTest(testFinal);
      }

      setTestActual(testFinal);
      setPantalla("resumen");
    }

  }

    function iniciarTestConTemas() {
      const basePreguntas = getPreguntasOposicionActiva();

      let filtradas = basePreguntas;

      if (tipoTest !== "mixto") {
        filtradas = basePreguntas.filter(p => p.categoria === tipoTest);
      }

      filtradas = filtradas.filter(p =>
        temasSeleccionados.includes(p.tema)
      );

      const seleccionadas = seleccionarPreguntasSinRepetir(
        filtradas,
        20,
        3
      );

      guardarTestReciente(seleccionadas);
      registrarPreguntasUsadas(seleccionadas);

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
    const basePreguntas = getPreguntasOposicionActiva();

    let filtradas = basePreguntas;

    if (tipoTest !== "mixto") {
      filtradas = basePreguntas.filter(
        p => p.categoria === tipoTest && temasActivos.includes(p.tema)
      );
    } else {
      filtradas = basePreguntas.filter(p => temasActivos.includes(p.tema));
    }

    const seleccionadas = seleccionarPreguntasSinRepetir(
      filtradas,
      20,
      3
    );

    guardarTestReciente(seleccionadas);
    registrarPreguntasUsadas(seleccionadas);

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

    const basePreguntas = getPreguntasOposicionActiva();

    const juridico = basePreguntas.filter(
      p => p.categoria === "jurídico" && temasActivos.includes(p.tema)
    );
    const especifico = basePreguntas.filter(
      p => p.categoria === "específico" && temasActivos.includes(p.tema)
    );

    const seleccionBase = [
      ...seleccionarPreguntasSinRepetir(juridico, numJuridico, 3),
      ...seleccionarPreguntasSinRepetir(especifico, numEspecifico, 3)
    ];

    const final = barajarConEquilibrioPorTema(seleccionBase);

    guardarTestReciente(final);
    registrarPreguntasUsadas(final);

    const nuevoTest = {
      modo: "oposicion",
      penalizacion: Number(penalizacionOposicion) || 1,
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
    const basePreguntas = getPreguntasOposicionActiva();

    const juridicoBase = basePreguntas.filter(
      p => p.categoria === "jurídico" && temasActivos.includes(p.tema)
    );
    const especificoBase = basePreguntas.filter(
      p => p.categoria === "específico" && temasActivos.includes(p.tema)
    );

    const idsBloqueadas = getIdsPreguntasBloqueadas();

    let juridico = juridicoBase.filter(p => !idsBloqueadas.includes(p.id));
    let especifico = especificoBase.filter(p => !idsBloqueadas.includes(p.id));

    if (juridico.length === 0) {
      juridico = juridicoBase;
    }

    if (especifico.length === 0) {
      especifico = especificoBase;
    }

    juridico = seleccionarPreguntasEquilibradasConLimitePorTema(
      juridico,
      juridico.length,
      3
    );
    especifico = seleccionarPreguntasEquilibradasConLimitePorTema(
      especifico,
      especifico.length,
      3
    );

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

    const clavesGlobales = [
      "oposicionActiva",
      "preguntasFavoritas",
      "testsRecientes",
      "preguntasUsadas",
      "preguntasPorTema",
      "rendimientoPorTema",
      "repasoPendientes",
      "repasoAciertos",
      "pomodoroStats",
      "pomodoroConfig",
      "pomodoroActive"
    ];

    const prefijosPorOposicion = [
      "historicoTests__",
      "historicoIdCounter__",
      "temasActivos__"
    ];

    const backup = {};

    clavesGlobales.forEach(k => {
      const valor = localStorage.getItem(k);
      if (valor !== null) {
        try {
          backup[k] = JSON.parse(valor);
        } catch {
          backup[k] = valor;
        }
      }
    });

    for (let i = 0; i < localStorage.length; i++) {
      const clave = localStorage.key(i);

      if (
        prefijosPorOposicion.some(prefijo =>
          clave.startsWith(prefijo)
        )
      ) {
        const valor = localStorage.getItem(clave);

        if (valor !== null) {
          try {
            backup[clave] = JSON.parse(valor);
          } catch {
            backup[clave] = valor;
          }
        }
      }
    }

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

        if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
          alert("El archivo de copia no tiene un formato válido.");
          return;
        }

        const clavesGlobalesPermitidas = [
          "oposicionActiva",
          "preguntasFavoritas",
          "testsRecientes",
          "preguntasUsadas",
          "preguntasPorTema",
          "rendimientoPorTema",
          "repasoPendientes",
          "repasoAciertos",
          "pomodoroStats",
          "pomodoroConfig",
          "pomodoroActive"
        ];

        const prefijosPorOposicionPermitidos = [
          "historicoTests__",
          "historicoIdCounter__",
          "temasActivos__"
        ];

        // Compatibilidad con backups antiguos de una sola oposición
        const clavesAntiguasMigrables = [
          "historicoTests",
          "historicoIdCounter",
          "temasActivos"
        ];

        const codigoMigracion =
          typeof datos.oposicionActiva === "string" && datos.oposicionActiva.trim()
            ? datos.oposicionActiva.trim()
            : localStorage.getItem("oposicionActiva");

        let clavesImportadas = 0;
        let clavesIgnoradas = 0;

        Object.entries(datos).forEach(([clave, valor]) => {

          const esGlobalPermitida = clavesGlobalesPermitidas.includes(clave);

          const esPorOposicionPermitida = prefijosPorOposicionPermitidos.some(
            prefijo => clave.startsWith(prefijo)
          );

          const esAntiguaMigrable = clavesAntiguasMigrables.includes(clave);

          if (esGlobalPermitida || esPorOposicionPermitida) {
            if (clave === "oposicionActiva") {
              const codigo = typeof valor === "string" ? valor.trim() : "";

              if (codigo) {
                localStorage.setItem(clave, codigo);
                clavesImportadas++;
              } else {
                clavesIgnoradas++;
              }

              return;
            }

            localStorage.setItem(clave, JSON.stringify(valor));
            clavesImportadas++;
            return;
          }

          if (esAntiguaMigrable && codigoMigracion) {
            const nuevaClave = `${clave}__${codigoMigracion}`;

            // No machacamos datos nuevos si ya existen
            if (localStorage.getItem(nuevaClave) === null) {
              localStorage.setItem(nuevaClave, JSON.stringify(valor));
              clavesImportadas++;
            } else {
              clavesIgnoradas++;
            }

            return;
          }

          clavesIgnoradas++;
        });

        if (clavesImportadas === 0) {
          alert("No se ha importado nada. El archivo no contiene claves válidas.");
          return;
        }

        alert(
          `Datos importados correctamente.\n\nClaves importadas: ${clavesImportadas}\nClaves ignoradas: ${clavesIgnoradas}\n\nLa app se recargará.`
        );

        window.location.reload();

      } catch {
        alert("El archivo no es válido.");
      }

    };

    reader.readAsText(file);

    // Permite volver a importar el mismo archivo si hace falta
    event.target.value = "";
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

  function borrarPreguntasPorTema() {
    const confirmar = window.confirm(
      "¿Seguro que quieres borrar el registro de preguntas preguntadas por tema?"
    );

    if (!confirmar) return;

    localStorage.removeItem("preguntasPorTema");
    localStorage.removeItem("rendimientoPorTema");

    setPreguntasPorTema({});
    setRendimientoPorTema({});

    alert("Registro de preguntas por tema eliminado.");
  }

  function iniciarTestDesdeLista(nombreExamen) {

    const basePreguntas = getPreguntasOposicionActiva();

    let seleccionadas = basePreguntas
      .filter(p => p.nombreExamen === nombreExamen)
      .sort(
        (a, b) =>
          Number(a.numeroPreguntaExamen) -
          Number(b.numeroPreguntaExamen)
      );

    const nuevoTest = {
      modo: modoTest, // 👈 clave: usa el modo actual
      nombreExamen,
      desdeElegirTest: true,
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

  const preguntaSegura =
    preguntasActivas && preguntasActivas.length > 0
      ? preguntasActivas[
          Math.min(indicePregunta, preguntasActivas.length - 1)
        ]
      : null;

  function getTituloPregunta() {
    if (modoFavoritas) return "Favoritas";
    if (testActual?.revisando) return "Revisión";
    if (testActual?.tipoGuardado === "repaso") return "Repaso";

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
  }

  function getSubtituloPregunta() {
    const contador = testActual?.modo === "rapido"
      ? `Pregunta ${getNumeroPreguntaRapidaActual()}`
      : `Pregunta ${indicePregunta + 1} / ${preguntasActivas.length}`;

    return preguntaSegura?.descripcionTema
      ? `${contador} · ${preguntaSegura.descripcionTema}`
      : contador;
  }

  function getTextoBotonSalidaPregunta() {
    if (modoFavoritas) return "Salir";
    if (testActual?.tipoGuardado === "repaso") return "Finalizar";
    if (testActual?.revisando) return "Finalizar";
    if (testActual?.modo === "rapido") return "Finalizar";

    return indicePregunta === preguntasActivas.length - 1
      ? "Finalizar"
      : "Salir";
  }

  function salirOFinalizarPregunta() {
    if (modoFavoritas) {
      setModoFavoritas(false);
      setPreguntasRevision(null);
      setPreguntasTest([]);
      setTestActual(null);
      setIndicePregunta(0);
      setPreguntaActual(null);
      setTipoFiltroTemario(null);
      setTemasFiltroTemario([]);
      setPantalla("home");
      return;
    }

    if (testActual?.revisando) {
      setPreguntasRevision(null);
      setIndicePregunta(0);
      setPreguntaActual(null);

      if (testActual?.modo === "oposicion") {
        setPantalla("modo");
      } else if (testActual?.modo === "rapido") {
        setPantalla("modo");
      } else {
        setPantalla("tipo");
      }

      setPreguntasTest([]);
      setTestActual(null);
      setAciertos(0);
      setModoFavoritas(false);
      return;
    }

    if (testActual?.modo === "rapido") {
      const testFinal = {
        ...testActual,
        finalizado: true,
        revisando: false,
        fechaFin: Date.now()
      };

      const preguntasRespondidas = testFinal.preguntas.filter(
        p => p.respuestaSeleccionada !== null
      );

      registrarPreguntasPorTema(
        preguntasRespondidas,
        !!testFinal.desdeElegirTest || testFinal.tipoGuardado === "repaso"
      );

      registrarRendimientoPorTema(
        testFinal,
        !!testFinal.desdeElegirTest || testFinal.tipoGuardado === "repaso"
      );

      registrarPreguntasUsadas(preguntasRespondidas);

      agregarFalladasDeTestARepaso(testFinal);
      guardarHistoricoTest(testFinal);
      setTestActual(testFinal);
      setPantalla("resumen");
      return;
    }

    const esUltima = indicePregunta === preguntasActivas.length - 1;

    if (testActual?.tipoGuardado === "repaso") {
      const testFinal = {
        ...testActual,
        finalizado: true,
        revisando: false,
        fechaFin: Date.now()
      };

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

    if (testFinal.modo === "oposicion" || testFinal.modo === "rapido") {
      agregarFalladasDeTestARepaso(testFinal);
    }

    registrarPreguntasPorTema(
      testFinal.preguntas,
      !!testFinal.desdeElegirTest || testFinal.tipoGuardado === "repaso"
    );

    registrarRendimientoPorTema(
      testFinal,
      !!testFinal.desdeElegirTest || testFinal.tipoGuardado === "repaso"
    );

    guardarHistoricoTest(testFinal);

    setTestActual(testFinal);
    setPantalla("resumen");
  }

  function irPreguntaAnterior() {
    const anterior = indicePregunta - 1;

    setIndicePregunta(anterior);

    if (preguntasRevision) {
      setPreguntaActual(preguntasRevision[anterior]);
    } else {
      setPreguntaActual(preguntasTest[anterior]);
    }
  }

  const pantallasConLayout = [
    "selector-oposicion",
    "home",
    "settings",
    "elegir-test",
    "temas",
    "temario",
    "preguntas-por-tema",
    "modo",
    "tipo",
    "config-oposicion",
    "resumen",
    "repaso-oposicion",
    "pomodoro",
    "estadisticas",
    "filtro-temario",
    "aviso-uso"
  ];

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100vw",
        minWidth: 0,
        padding:
          pantalla === "pregunta" || pantallasConLayout.includes(pantalla)
            ? 0
            : 20,
        minHeight: "100dvh",
        overflow: "hidden",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        background: "#242424"
      }}
    >

    {/* SELECTOR DE OPOSICIÓN */}
    {pantalla === "selector-oposicion" && (
      <ScreenLayout
        title="Selecciona oposición"
        subtitle={
          preguntas.length === 0
            ? "Cargando preguntas..."
            : `${getOposicionesDisponibles().length} oposiciones disponibles`
        }
      >
        {(() => {
          const oposiciones = getOposicionesDisponibles();

          if (preguntas.length === 0) {
            return <p>Cargando preguntas...</p>;
          }

          if (oposiciones.length === 0) {
            return (
              <p>
                No se han encontrado oposiciones en la base de preguntas.
              </p>
            );
          }

            return (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 16
                }}
              >
                {oposiciones.map(codigo => {
                  const total = preguntas.filter(p =>
                    Array.isArray(p.oposiciones) &&
                    p.oposiciones.includes(codigo)
                  ).length;

                  return (
                    <button
                      key={codigo}
                      onClick={() => seleccionarOposicion(codigo)}
                      style={{
                        padding: 18,
                        borderRadius: 12,
                        fontSize: 18,
                        textAlign: "left",
                        width: "100%"
                      }}
                    >
                      <div style={{ fontWeight: "bold" }}>
                        {codigo}
                      </div>

                      <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
                        {total} preguntas disponibles
                      </div>
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  marginTop: 60,
                  textAlign: "center"
                }}
              >
                <hr
                  style={{
                    border: "none",
                    height: 1,
                    background: "rgba(255,255,255,0.2)",
                    marginBottom: 18
                  }}
                />

                <p style={{ opacity: 0.6, fontSize: 14, margin: 0 }}>
                  Versión {version}
                </p>

                <p style={{ opacity: 0.6, fontSize: 14, margin: "14px 0 0" }}>
                  © 2026 OpoTool. Todos los derechos reservados.
                </p>

                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    justifyContent: "center",
                    gap: 18,
                    flexWrap: "wrap",
                    fontSize: 14
                  }}
                >
                  <a
                    href="mailto:soporte@opotool.app?subject=Contacto%20OpoTool"
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#60a5fa",
                      textDecoration: "underline",
                      cursor: "pointer",
                      font: "inherit"
                    }}
                  >
                    Contacto / reportar bug
                  </a>

                  <button
                    onClick={() => setPantalla("aviso-uso")}
                    style={{
                      padding: 0,
                      border: "none",
                      background: "transparent",
                      color: "#60a5fa",
                      textDecoration: "underline",
                      cursor: "pointer",
                      font: "inherit"
                    }}
                  >
                    Aviso
                  </button>
                </div>
              </div>
            </>
          );
        })()}
      </ScreenLayout>
    )}

    {/* AVISO */}
    {pantalla === "aviso-uso" && (
      <ScreenLayout
        title="Aviso"
        subtitle="OpoTool"
        bottomActions={
          <button
            onClick={() => setPantalla("selector-oposicion")}
            style={{ padding: 12, width: "100%" }}
          >
            Volver
          </button>
        }
      >
        <div
          style={{
            display: "grid",
            gap: 16,
            padding: 16,
            borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            lineHeight: 1.5
          }}
        >
          <p style={{ marginTop: 0 }}>
            OpoTool es una aplicación de entrenamiento para oposiciones.
          </p>

          <p>
            El uso de esta aplicación es personal. Queda prohibida la copia,
            redistribución, extracción o reutilización no autorizada de las
            preguntas, respuestas, estructura de test o cualquier otro contenido
            incluido en la aplicación.
          </p>

          <p>
            El contenido se ofrece como herramienta de estudio y preparación,
            sin garantizar resultados concretos en procesos selectivos.
          </p>

          <p>
            En esta versión, el progreso y los datos de uso se guardan en el
            propio dispositivo mediante almacenamiento local.
          </p>
        </div>
      </ScreenLayout>
    )}

    {/* HOME */}
    {pantalla === "home" && (
      <ScreenLayout
        title="Mi app"
        subtitle={
          oposicionActiva
            ? `${oposicionActiva} · ${getPreguntasOposicionActiva().length} preguntas`
            : null
        }
        topActions={
          <button
            onClick={volverASelectorOposicion}
            style={{
              padding: "8px 10px",
              fontSize: 13,
              whiteSpace: "nowrap"
            }}
          >
            Cambiar
          </button>
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
            gridAutoRows: "1fr",
            gap: 20
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
            onClick={() => abrirFiltroTemario("favoritas")}
            style={cardStyle}
          >
            <div style={{ fontSize: 40 }}>⭐</div>
            <p style={cardTextStyle}>Favoritas</p>
          </div>

          {/* REPASO */}
          <div
            onClick={() => abrirFiltroTemario("repaso")}
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
      </ScreenLayout>
    )}
    
    {/* ESTADISTICAS */}
    {pantalla === "estadisticas" && (
      <ScreenLayout
        title="Estadísticas"
        subtitle={
          oposicionActiva
            ? `Oposición activa: ${oposicionActiva} · ${getTestsSemanaActual()} test esta semana`
            : `${getTestsSemanaActual()} test esta semana`
        }
        bottomActions={
          <button
            onClick={() => setPantalla("home")}
            style={{ padding: 12, width: "100%" }}
          >
            Volver
          </button>
        }
      >
        <div
          style={{
            display: "grid",
            gap: 24,
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box"
          }}
        >

          <section
            style={{
              width: "100%",
              maxWidth: "100%",
              minWidth: 0,
              boxSizing: "border-box",
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)"
            }}
          >
            <h3 style={{ marginTop: 0 }}>Evolución semanal</h3>

            {getDatosEstadisticas().length === 0 ? (
              <p>No hay datos suficientes aún.</p>
            ) : (
              <div
                style={{
                  marginTop: 20,
                  width: "100%",
                  maxWidth: "100%",
                  height: 260,
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    overflowX: "auto",
                    overflowY: "hidden",
                    paddingBottom: 10,
                    WebkitOverflowScrolling: "touch"
                  }}
                >
                  <div
                    style={{
                      width: Math.max(getDatosEstadisticas().length * 70, 280),
                      minWidth: "100%",
                      height: 230
                    }}
                  >
                    <ResponsiveContainer
                      width="100%"
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
              </div>
            )}
          </section>

          <section
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)"
            }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 20 }}>
              Histórico semanal
            </h3>

            {(() => {
              const semanas = getSemanasOrdenadas();

              if (semanas.length === 0) {
                return <p>No hay test guardados todavía.</p>;
              }

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
                      gridTemplateColumns: "64px 32px minmax(0, 1fr)",
                      alignItems: "center",
                      cursor: "pointer",
                      minWidth: 0
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>
                      {item.semana}
                    </div>

                    <div>
                      {item.total}
                    </div>

                    <div style={{ paddingLeft: 10, paddingRight: 10, minWidth: 0 }}>
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
                    <div style={{ marginTop: 12 }}>
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
                              gap: 12,
                              marginBottom: 10,
                              padding: "8px 0",
                              borderBottom: "1px solid rgba(255,255,255,0.08)"
                            }}
                          >
                            <div
                              style={{
                                color: "#d1d5db",
                                fontSize: 14,
                                minWidth: 0,
                                overflow: "hidden"
                              }}
                            >
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
                                  <div
                                    style={{
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap"
                                    }}
                                  >
                                    {new Date(h.fecha).toLocaleDateString()} · {h.modo}
                                    {h.nombreExamen ? ` · ${h.nombreExamen}` : ""}
                                  </div>

                                  <div>
                                    {h.modo === "oposicion" ? (
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
                                fontSize: 16,
                                flex: "0 0 auto"
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
          </section>

        </div>
      </ScreenLayout>
    )}

    {/* SELECCIÓN DE MODO */}
    {pantalla === "modo" && (
      <ScreenLayout
        title="Selecciona modo"
        subtitle={
          oposicionActiva
            ? `Oposición activa: ${oposicionActiva}`
            : null
        }
        bottomActions={
          <button
            onClick={() => setPantalla("home")}
            style={{ padding: 12, width: "100%" }}
          >
            Volver
          </button>
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16
          }}
        >
          <button
            onClick={() => {
              setModoTest("practica");
              setPantalla("tipo");
            }}
            style={{
              padding: 18,
              borderRadius: 12,
              textAlign: "left"
            }}
          >
            <div style={{ fontSize: 28 }}>🟢</div>
            <strong>Modo práctica</strong>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
              Corrección inmediata y repaso al finalizar.
            </div>
          </button>

          <button
            onClick={() => {
              setModoTest("rapido");
              empezarModoRapido();
            }}
            style={{
              padding: 18,
              borderRadius: 12,
              textAlign: "left"
            }}
          >
            <div style={{ fontSize: 28 }}>🟡</div>
            <strong>Modo rápido</strong>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
              Preguntas alternas jurídico/específico.
            </div>
          </button>

          <button
            onClick={() => {
              setModoTest("oposicion");
              setPantalla("config-oposicion");
            }}
            style={{
              padding: 18,
              borderRadius: 12,
              textAlign: "left"
            }}
          >
            <div style={{ fontSize: 28 }}>🔵</div>
            <strong>Modo oposición</strong>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
              Simulación con nota y penalización.
            </div>
          </button>
        </div>
      </ScreenLayout>
    )}

    {/* CONFIGURACIÓN OPOSICIÓN */}
    {pantalla === "config-oposicion" && (
      <ScreenLayout
        title="Configurar oposición"
        subtitle={`Jurídico ${configOposicion}% · Específico ${100 - configOposicion}%`}
        bottomActions={
          <>
            <button
              onClick={() => setPantalla("modo")}
              style={{ padding: 12, flex: 1 }}
            >
              Volver
            </button>

            <button
              onClick={() => empezarOposicion()}
              style={{ padding: 12, flex: 1 }}
            >
              Empezar
            </button>
          </>
        }
      >
        <div
          style={{
            display: "grid",
            gap: 24
          }}
        >
          <section
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)"
            }}
          >
            <h3 style={{ marginTop: 0 }}>Reparto del test</h3>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 12
              }}
            >
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
              style={{ width: "100%" }}
            />
          </section>

          <section
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)"
            }}
          >
            <h3 style={{ marginTop: 0 }}>Penalización</h3>

            <label>
              Cada fallo resta 1/
              <input
                type="number"
                min="1"
                value={penalizacionOposicion}
                onChange={(e) => {
                  const value = e.target.value;

                  if (value === "") {
                    setPenalizacionOposicion("");
                    return;
                  }

                  const val = Number(value);

                  if (!isNaN(val) && val > 0) {
                    setPenalizacionOposicion(value);
                  }
                }}
                onBlur={() => {
                  const val = Number(penalizacionOposicion);

                  if (!penalizacionOposicion || isNaN(val) || val <= 0) {
                    setPenalizacionOposicion("1");
                  }
                }}
                style={{
                  width: 70,
                  marginLeft: 8,
                  marginRight: 8,
                  padding: "6px 8px",
                  fontSize: 16,
                  borderRadius: 6
                }}
              />
              de una acertada
            </label>
          </section>

          <button
            onClick={() => setPantalla("elegir-test")}
            style={{
              padding: 14,
              borderRadius: 10,
              width: "100%"
            }}
          >
            📋 Elegir test concreto
          </button>
        </div>
      </ScreenLayout>
    )}

    {/* SELECCIÓN DE TIPO */}
    {pantalla === "tipo" && (
      <ScreenLayout
        title="Selecciona tipo de test"
        subtitle={
          modoTest === "practica"
            ? "Modo práctica"
            : modoTest === "oposicion"
            ? "Modo oposición"
            : null
        }
        bottomActions={
          <button
            onClick={() => setPantalla("modo")}
            style={{ padding: 12, width: "100%" }}
          >
            Volver
          </button>
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 16
          }}
        >
          <button
            onClick={() => empezarTest("jurídico")}
            style={{
              padding: 18,
              borderRadius: 12,
              textAlign: "left"
            }}
          >
            <div style={{ fontSize: 28 }}>⚖️</div>
            <strong>Jurídico</strong>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
              Solo preguntas jurídicas activas.
            </div>
          </button>

          <button
            onClick={() => empezarTest("específico")}
            style={{
              padding: 18,
              borderRadius: 12,
              textAlign: "left"
            }}
          >
            <div style={{ fontSize: 28 }}>🛠️</div>
            <strong>Específico</strong>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
              Solo preguntas específicas activas.
            </div>
          </button>

          <button
            onClick={() => empezarTest("mixto")}
            style={{
              padding: 18,
              borderRadius: 12,
              textAlign: "left"
            }}
          >
            <div style={{ fontSize: 28 }}>🔀</div>
            <strong>Mixto</strong>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
              Combina jurídico y específico.
            </div>
          </button>

          <button
            onClick={() => setPantalla("elegir-test")}
            style={{
              padding: 18,
              borderRadius: 12,
              textAlign: "left"
            }}
          >
            <div style={{ fontSize: 28 }}>📋</div>
            <strong>Elegir test</strong>
            <div style={{ fontSize: 13, opacity: 0.75, marginTop: 6 }}>
              Hacer un test concreto del Excel.
            </div>
          </button>
        </div>
      </ScreenLayout>
    )}

    {/* ELEGIR TEST */}
    {pantalla === "elegir-test" && (
      <ScreenLayout
        title="Selecciona un test"
        subtitle={`${Array.from(
          new Set(
            getPreguntasOposicionActiva()
              .map(p => p.nombreExamen)
              .filter(Boolean)
          )
        ).length} tests disponibles`}
        bottomActions={
          <button
            onClick={() => setPantalla(modoTest === "oposicion" ? "config-oposicion" : "tipo")}
            style={{ padding: 12, width: "100%" }}
          >
            Volver
          </button>
        }
      >
        {(() => {

          const basePreguntas = getPreguntasOposicionActiva();

          const testsUnicos = Array.from(
            new Set(
              basePreguntas
                .map(p => p.nombreExamen)
                .filter(Boolean)
            )
          ).sort();

          if (testsUnicos.length === 0) {
            return <p>No hay tests disponibles para esta oposición.</p>;
          }

          return (
            <div
              style={{
                display: "grid",
                gap: 10
              }}
            >
              {testsUnicos.map((nombre, i) => {

                const total = basePreguntas.filter(
                  p => p.nombreExamen === nombre
                ).length;

                const vecesTotal = historico.filter(
                  h =>
                    h.nombreExamen === nombre &&
                    (h.modo === "practica" || h.modo === "oposicion")
                ).length;

                return (
                  <div
                    key={i}
                    onClick={() => iniciarTestDesdeLista(nombre)}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      background: "#1f2937",
                      color: "white",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ fontWeight: "bold" }}>{nombre}</div>

                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                      {total} preguntas ·{" "}
                      {vecesTotal === 0
                        ? "No realizado"
                        : vecesTotal === 1
                        ? "Realizado 1 vez"
                        : `Realizado ${vecesTotal} veces`}
                    </div>
                  </div>
                );
              })}
            </div>
          );

        })()}
      </ScreenLayout>
    )}

    {/* SELECCIÓN DE TEMAS */}
    {pantalla === "temas" && (
      <ScreenLayout
        title="Selecciona los temas"
        subtitle={`${temasSeleccionados.length} seleccionados de ${temasDisponibles.length}`}
        bottomActions={
          <>
            <button
              onClick={() => setPantalla("tipo")}
              style={{ padding: 12, flex: 1 }}
            >
              Volver
            </button>

            <button
              disabled={temasSeleccionados.length === 0}
              onClick={() => iniciarTestConTemas()}
              style={{ padding: 12, flex: 1 }}
            >
              Empezar
            </button>

            <button
              onClick={() => iniciarTestAleatorio()}
              style={{ padding: 12, flex: 1 }}
            >
              🎲 Aleatorio
            </button>
          </>
        }
      >
        {temasDisponibles.length === 0 ? (
          <p>No hay temas disponibles para esta selección.</p>
        ) : (
          <div style={{ display: "grid", gap: 8 }}>
            {temasDisponibles.map((t, i) => (
              <label
                key={i}
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "flex-start",
                  padding: 10,
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.06)"
                }}
              >
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
                  style={{ marginTop: 3 }}
                />

                <span>
                  <strong>{t.tema}</strong>
                  {t.descripcion ? ` - ${t.descripcion}` : ""}
                </span>
              </label>
            ))}
          </div>
        )}
      </ScreenLayout>
    )}

    {/* FILTRO TEMARIO FAVORITAS / REPASO */}
    {pantalla === "filtro-temario" && (
      <ScreenLayout
        title={
          tipoFiltroTemario === "favoritas"
            ? "Filtrar favoritas"
            : "Filtrar repaso"
        }
        subtitle={`${temasFiltroTemario.length} temas seleccionados`}
        bottomActions={
          <>
            <button
              onClick={() => {
                setTipoFiltroTemario(null);
                setTemasFiltroTemario([]);
                setPantalla("home");
              }}
              style={{ padding: 12, flex: 1 }}
            >
              Volver
            </button>

            <button
              disabled={temasFiltroTemario.length === 0}
              onClick={iniciarDesdeFiltroTemario}
              style={{ padding: 12, flex: 1 }}
            >
              Empezar
            </button>
          </>
        }
      >
        {(() => {
          const temas = getTemasFiltroTemario();
          const candidatas = getPreguntasCandidatasFiltroTemario();

          if (temas.length === 0) {
            return <p>No hay temas disponibles.</p>;
          }

          return (
            <div style={{ display: "grid", gap: 14 }}>
              <section
                style={{
                  padding: 12,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)"
                }}
              >
                <p style={{ marginTop: 0 }}>
                  {candidatas.length} preguntas disponibles
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap"
                  }}
                >
                  <button
                    onClick={() =>
                      setTemasFiltroTemario(temas.map(t => t.tema))
                    }
                    style={{ padding: "8px 10px" }}
                  >
                    Seleccionar todos
                  </button>

                  <button
                    onClick={() => setTemasFiltroTemario([])}
                    style={{ padding: "8px 10px" }}
                  >
                    Limpiar
                  </button>
                </div>
              </section>

              <div style={{ display: "grid", gap: 8 }}>
                {temas.map((t, i) => (
                  <label
                    key={i}
                    style={{
                      display: "flex",
                      gap: 8,
                      alignItems: "flex-start",
                      padding: 10,
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.06)"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={temasFiltroTemario.includes(t.tema)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTemasFiltroTemario(prev => [...prev, t.tema]);
                        } else {
                          setTemasFiltroTemario(prev =>
                            prev.filter(x => x !== t.tema)
                          );
                        }
                      }}
                      style={{ marginTop: 3 }}
                    />

                    <span>
                      <strong>{t.tema}</strong>
                      {t.descripcion ? ` - ${t.descripcion}` : ""}
                      <span style={{ opacity: 0.65 }}>
                        {" "}({t.total})
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          );
        })()}
      </ScreenLayout>
    )}

    {/* PREGUNTA */}
    {pantalla === "pregunta" && preguntaSegura && (
      <ScreenLayout
        title={getTituloPregunta()}
        subtitle={getSubtituloPregunta()}
        topActions={
          !desdeRepaso && (
            <>
              <button
                onClick={() => toggleFavorita(preguntaSegura.id)}
                style={{
                  padding: "8px 10px",
                  backgroundColor: esFavorita(preguntaSegura.id)
                    ? "#ffd700"
                    : "white",
                  color: "black",
                  whiteSpace: "nowrap"
                }}
              >
                ⭐
              </button>

              <button
                onClick={salirOFinalizarPregunta}
                style={{
                  padding: "8px 10px",
                  whiteSpace: "nowrap"
                }}
              >
                {getTextoBotonSalidaPregunta()}
              </button>
            </>
          )
        }
        bottomActions={
          desdeRepaso ? (
            <button
              onClick={() => {
                setDesdeRepaso(false);
                setPantalla("repaso-oposicion");
              }}
              style={{ padding: 12, width: "100%" }}
            >
              Volver a pantalla de repaso
            </button>
          ) : (
            <>
              {indicePregunta > 0 ? (
                <button
                  onClick={irPreguntaAnterior}
                  style={{ padding: 12, flex: 1 }}
                >
                  Anterior
                </button>
              ) : (
                <div style={{ flex: 1 }} />
              )}

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "flex-end"
                }}
              >
                {testActual?.modo === "oposicion" ? (
                  testActual?.revisando ? (
                    indicePregunta < preguntasActivas.length - 1 ? (
                      <button
                        onClick={siguientePregunta}
                        style={{ padding: 12, width: "100%" }}
                      >
                        Siguiente
                      </button>
                    ) : (
                      <div />
                    )
                  ) : indicePregunta < preguntasActivas.length - 1 ? (
                    <button
                      onClick={siguientePregunta}
                      style={{ padding: 12, width: "100%" }}
                    >
                      Siguiente
                    </button>
                  ) : (
                    <button
                      onClick={() => setPantalla("repaso-oposicion")}
                      style={{ padding: 12, width: "100%" }}
                    >
                      Repasar
                    </button>
                  )
                ) : testActual?.modo === "rapido" ? (
                  indicePregunta < preguntasActivas.length - 1 ? (
                    <button
                      onClick={siguientePregunta}
                      style={{ padding: 12, width: "100%" }}
                    >
                      Siguiente
                    </button>
                  ) : (
                    <div />
                  )
                ) : indicePregunta < preguntasActivas.length - 1 ? (
                  <button
                    onClick={siguientePregunta}
                    style={{ padding: 12, width: "100%" }}
                  >
                    Siguiente
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </>
          )
        }
      >
        <div
          style={{
            display: "grid",
            gap: 14,
            width: "100%",
            maxWidth: "100%",
            minWidth: 0,
            boxSizing: "border-box"
          }}
        >
          <section
            style={{
              padding: 12,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              boxSizing: "border-box",
              minWidth: 0
            }}
          >
            <p
              style={{
                fontSize: 13,
                opacity: 0.75,
                margin: 0,
                overflowWrap: "anywhere"
              }}
            >
              {preguntaSegura.nombreExamen}
              {preguntaSegura.numeroPreguntaExamen
                ? ` · Nº ${preguntaSegura.numeroPreguntaExamen}`
                : ""}
            </p>
          </section>

          <section
            style={{
              padding: 14,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              boxSizing: "border-box",
              minWidth: 0
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 0,
                lineHeight: 1.35,
                overflowWrap: "anywhere"
              }}
            >
              {preguntaSegura.texto}
            </h3>
          </section>

          <div style={{ display: "grid", gap: 10 }}>
            {modoFavoritas ? (
              preguntaSegura.respuestas.map((r, i) => (
                <div
                  key={i}
                  style={{
                    padding: 12,
                    backgroundColor: r.correcta ? "lightgreen" : "white",
                    borderRadius: 8,
                    color: "black",
                    lineHeight: 1.35,
                    overflowWrap: "anywhere"
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
                    padding: 12,
                    borderRadius: 8,
                    textAlign: "left",
                    lineHeight: 1.35,
                    whiteSpace: "normal",
                    overflowWrap: "anywhere",
                    backgroundColor: (() => {
                      const seleccionada =
                        testActual?.preguntas[indicePregunta]?.respuestaSeleccionada;

                      if (testActual?.modo === "practica" || testActual?.modo === "rapido") {
                        if (seleccionada === null) return "white";

                        if (i === seleccionada) {
                          return r.correcta ? "lightgreen" : "salmon";
                        }

                        return r.correcta ? "lightgreen" : "white";
                      }

                      if (!testActual?.revisando) {
                        if (seleccionada === null) return "white";
                        return i === seleccionada ? "#cce5ff" : "white";
                      }

                      if (testActual?.modo === "oposicion") {
                        if (!testActual?.revisando) {
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
                padding: 12,
                width: "100%",
                backgroundColor: "#6366f1",
                color: "white",
                borderRadius: 8
              }}
            >
              🤖 Explicar pregunta con IA
            </button>
          )}
        </div>
      </ScreenLayout>
    )}

    {/* REPASO OPOSICIÓN */}
    {pantalla === "repaso-oposicion" && (
      <ScreenLayout
        title="Repasar preguntas"
        subtitle={`${testActual?.preguntas?.filter(p => p.respuestaSeleccionada !== null).length || 0} respondidas de ${testActual?.preguntas?.length || 0}`}
        bottomActions={
          <>
            <button
              onClick={() => setPantalla("pregunta")}
              style={{ padding: 12, flex: 1 }}
            >
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

                agregarFalladasDeTestARepaso(testFinal);

                registrarPreguntasPorTema(
                  testFinal.preguntas,
                  !!testFinal.desdeElegirTest || testFinal.tipoGuardado === "repaso"
                );

                registrarRendimientoPorTema(
                  testFinal,
                  !!testFinal.desdeElegirTest || testFinal.tipoGuardado === "repaso"
                );

                guardarHistoricoTest(testFinal);

                setTestActual(testFinal);
                setPantalla("resumen");
              }}
              style={{ padding: 12, flex: 1 }}
            >
              Finalizar test
            </button>
          </>
        }
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(52px, 1fr))",
            gap: 10
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
      </ScreenLayout>
    )}

    {/* RESUMEN */}
    {pantalla === "resumen" && (
      <ScreenLayout
        title="Resumen del test"
        subtitle={
          testActual?.modo === "oposicion"
            ? "Resultado de oposición"
            : testActual?.modo === "rapido"
            ? "Resultado del modo rápido"
            : "Resultado de práctica"
        }
        bottomActions={
          <>
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
              style={{ padding: 12, flex: 1 }}
            >
              Finalizar
            </button>

            {testActual?.modo === "practica" && testActual?.tipoGuardado !== "repaso" ? (
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
                style={{ padding: 12, flex: 1 }}
              >
                Repaso
              </button>
            ) : testActual?.modo !== "rapido" ? (
              <button
                onClick={() => {
                  const todas = testActual.preguntas;

                  const revision = todas;

                  setPreguntasRevision(revision);

                  setTestActual(prev => ({
                    ...prev,
                    revisando: true
                  }));

                  setIndicePregunta(0);
                  setPreguntaActual(revision[0]);
                  setPantalla("pregunta");
                }}
                style={{ padding: 12, flex: 1 }}
              >
                Revisar test
              </button>
            ) : (
              <div style={{ flex: 1 }} />
            )}
          </>
        }
      >
        {(() => {
          const total = testActual?.preguntas.length || 0;
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
              <div
                style={{
                  display: "grid",
                  gap: 14
                }}
              >
                <div
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    background: "rgba(255,255,255,0.06)"
                  }}
                >
                  <p>Correctas: {correctas}</p>
                  <p>Incorrectas: {incorrectas}</p>
                  <p>En blanco: {total - correctas - incorrectas}</p>

                  <h3>
                    Nota final: {nota.toFixed(2)} / 10
                  </h3>
                </div>
              </div>
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
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "rgba(255,255,255,0.06)"
                }}
              >
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
              </div>
            );
          }

          return (
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                background: "rgba(255,255,255,0.06)"
              }}
            >
              <p>
                Acertadas {aciertosFinal} de {total} preguntas
              </p>

              <p>
                Falladas {fallosFinal}
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
            </div>
          );
        })()}
      </ScreenLayout>
    )}

    {/* POMODORO */}
    {pantalla === "pomodoro" && (
      <ScreenLayout
        title="Modo Estudio 🍅"
        subtitle={pomodoroMode === "work" ? "Estudio" : "Descanso"}
        bottomActions={
          <button
            onClick={() => setPantalla("home")}
            style={{ padding: 12, width: "100%" }}
          >
            Volver
          </button>
        }
      >
        <div
          style={{
            display: "grid",
            gap: 24
          }}
        >

          <section
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)"
            }}
          >
            <h3 style={{ marginTop: 0 }}>Configuración</h3>

            <div style={{ display: "grid", gap: 12 }}>
              <label>
                Estudio:
                <input
                  type="number"
                  min="1"
                  value={workDuration}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value === "") {
                      setWorkDuration("");
                      return;
                    }

                    const minutes = Number(value);

                    if (!isNaN(minutes) && minutes > 0) {
                      setWorkDuration(value);
                    }
                  }}
                  onBlur={() => {
                    const minutes = Number(workDuration);

                    if (!workDuration || isNaN(minutes) || minutes <= 0) {
                      setWorkDuration("1");
                    }
                  }}
                  style={{
                    width: 70,
                    marginLeft: 10,
                    padding: "6px 8px",
                    fontSize: 16,
                    borderRadius: 8
                  }}
                />
                <span style={{ marginLeft: 4 }}>min</span>
              </label>

              <label>
                Descanso:
                <input
                  type="number"
                  min="1"
                  value={breakDuration}
                  onChange={(e) => {
                    const value = e.target.value;

                    if (value === "") {
                      setBreakDuration("");
                      return;
                    }

                    const minutes = Number(value);

                    if (!isNaN(minutes) && minutes > 0) {
                      setBreakDuration(value);
                    }
                  }}
                  onBlur={() => {
                    const minutes = Number(breakDuration);

                    if (!breakDuration || isNaN(minutes) || minutes <= 0) {
                      setBreakDuration("1");
                    }
                  }}
                  style={{
                    width: 70,
                    marginLeft: 10,
                    padding: "6px 8px",
                    fontSize: 16,
                    borderRadius: 8
                  }}
                />
                <span style={{ marginLeft: 4 }}>min</span>
              </label>
            </div>
          </section>

          <section
            style={{
              padding: 20,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              textAlign: "center"
            }}
          >
            <h3 style={{ fontSize: 24, marginTop: 0 }}>
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

            <div
              style={{
                display: "flex",
                gap: 10,
                justifyContent: "center",
                flexWrap: "wrap"
              }}
            >
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
          </section>

          <section
            style={{
              padding: 16,
              borderRadius: 12,
              background: "rgba(255,255,255,0.06)"
            }}
          >
            <h3 style={{ marginTop: 0 }}>Estadísticas</h3>

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
          </section>

        </div>
      </ScreenLayout>
    )}

    {/* SETTINGS */}
    {pantalla === "settings" && (
      <ScreenLayout
        title="Ajustes"
        subtitle="Copia de seguridad, temario y mantenimiento"
        bottomActions={
          <button
            onClick={() => setPantalla("home")}
            style={{ padding: 12, width: "100%" }}
          >
            Volver
          </button>
        }
      >
        <div style={{ display: "grid", gap: 14 }}>

          <button
            onClick={exportarDatos}
            style={{ padding: 12, width: "100%" }}
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

          <hr style={{ width: "100%", margin: "16px 0" }} />

          <button
            onClick={borrarFavoritas}
            style={{ padding: 12, width: "100%" }}
          >
            🧹 Borrar favoritas
          </button>

          <button
            onClick={borrarRepaso}
            style={{ padding: 12, width: "100%" }}
          >
            🧹 Borrar preguntas de repaso
          </button>

          <hr style={{ width: "100%", margin: "16px 0" }} />

          <button
            onClick={reiniciarRepeticion}
            style={{ padding: 12, width: "100%" }}
          >
            🔁 Reiniciar control de repetición
          </button>

          <button
            onClick={() => setPantalla("temario")}
            style={{ padding: 12, width: "100%" }}
          >
            📚 Selección de temario
          </button>

          <button
            onClick={() => setPantalla("preguntas-por-tema")}
            style={{ padding: 12, width: "100%" }}
          >
            📊 Preguntas por tema
          </button>

        </div>
      </ScreenLayout>
    )}

    {/* SELECCIÓN DE TEMARIO */}
    {pantalla === "temario" && (
      <ScreenLayout
        title="Selección de temario"
        subtitle={`${temasActivos.length} temas activos`}
        bottomActions={
          <button
            onClick={() => setPantalla("settings")}
            style={{ padding: 12, width: "100%" }}
          >
            Volver
          </button>
        }
      >
        {(() => {

          const basePreguntas = getPreguntasOposicionActiva();

          const temasOrdenados = Array.from(
            new Map(
              basePreguntas.map(p => {

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

            if (a.numero === null && b.numero === null) return 0;
            if (a.numero === null) return -1;
            if (b.numero === null) return 1;

            return a.numero - b.numero;
          });

          if (temasOrdenados.length === 0) {
            return <p>No hay temas disponibles para esta oposición.</p>;
          }

          return (
            <div style={{ display: "grid", gap: 8 }}>
              {temasOrdenados.map((t, i) => (
                <label
                  key={i}
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    padding: 10,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.06)"
                  }}
                >
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

                      localStorage.setItem(
                        storageKey("temasActivos", oposicionActiva),
                        JSON.stringify(nuevos)
                      );
                    }}
                    style={{ marginTop: 3 }}
                  />

                  <span>
                    <strong>{t.tema}</strong>
                    {t.descripcion ? ` - ${t.descripcion}` : ""}
                  </span>
                </label>
              ))}
            </div>
          );

        })()}
      </ScreenLayout>
    )}

    {/* PREGUNTAS POR TEMA */}
    {pantalla === "preguntas-por-tema" && (
      <ScreenLayout
        title="Preguntas por tema"
        subtitle={`Orden: ${ordenPreguntasPorTema === "preguntas" ? "preguntas" : "% aciertos"}`}
        topActions={
          <button
            onClick={borrarPreguntasPorTema}
            style={{
              padding: "8px 10px",
              fontSize: 13,
              whiteSpace: "nowrap"
            }}
          >
            🧹 Borrar
          </button>
        }
        bottomActions={
          <button
            onClick={() => setPantalla("settings")}
            style={{ padding: 12, width: "100%" }}
          >
            Volver
          </button>
        }
      >
        {(() => {
          const basePreguntas = getPreguntasOposicionActiva();

          const temasOrdenados = Array.from(
            new Map(
              basePreguntas.map(p => {
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
            .map(t => {
              const total = preguntasPorTema[t.tema] || 0;

              const rendimiento = rendimientoPorTema[t.tema] || {
                respondidas: 0,
                aciertos: 0
              };

              const porcentajeAcierto =
                rendimiento.respondidas > 0
                  ? Math.round((rendimiento.aciertos / rendimiento.respondidas) * 100)
                  : null;

              return {
                ...t,
                total,
                porcentajeAcierto
              };
            })
            .sort((a, b) => {
              if (ordenPreguntasPorTema === "aciertos") {
                const aPct = a.porcentajeAcierto ?? -1;
                const bPct = b.porcentajeAcierto ?? -1;

                if (bPct !== aPct) return bPct - aPct;
              } else {
                if (b.total !== a.total) return b.total - a.total;
              }

              if (a.numero === null && b.numero === null) {
                return String(a.tema).localeCompare(String(b.tema));
              }

              if (a.numero === null) return 1;
              if (b.numero === null) return -1;

              return a.numero - b.numero;
            });

          if (temasOrdenados.length === 0) {
            return <p>No hay temas disponibles para esta oposición.</p>;
          }

          return (
            <div
              style={{
                width: "100%",
                maxWidth: "100%",
                minWidth: 0,
                boxSizing: "border-box"
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "64px 72px minmax(0, 1fr)",
                  gap: 8,
                  padding: "10px 0",
                  borderBottom: "2px solid rgba(255,255,255,0.2)",
                  fontWeight: "bold",
                  position: "sticky",
                  top: 0,
                  background: "#242424",
                  zIndex: 20,
                  fontSize: 13,
                  boxShadow: "0 -24px 0 #242424, 0 8px 12px rgba(36,36,36,0.9)"
                }}
              >
                <div
                  onClick={() => setOrdenPreguntasPorTema("preguntas")}
                  style={{ cursor: "pointer" }}
                >
                  Nº {ordenPreguntasPorTema === "preguntas" ? "↓" : ""}
                </div>

                <div
                  onClick={() => setOrdenPreguntasPorTema("aciertos")}
                  style={{ cursor: "pointer" }}
                >
                  % {ordenPreguntasPorTema === "aciertos" ? "↓" : ""}
                </div>

                <div>Tema</div>
              </div>

              {temasOrdenados.map((t, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "64px 72px minmax(0, 1fr)",
                    gap: 8,
                    padding: "12px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    alignItems: "start",
                    minWidth: 0
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14
                    }}
                  >
                    {t.total}
                  </div>

                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14
                    }}
                  >
                    {t.porcentajeAcierto !== null
                      ? `${t.porcentajeAcierto}%`
                      : "-"}
                  </div>

                  <div
                    style={{
                      minWidth: 0,
                      overflowWrap: "anywhere",
                      lineHeight: 1.35
                    }}
                  >
                    <strong>{t.tema}</strong>
                    {t.descripcion ? ` - ${t.descripcion}` : ""}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </ScreenLayout>
    )}

    </div>
  )
}

export default App;
