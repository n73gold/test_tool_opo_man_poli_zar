# Al final hay que dejar la ruta tal que asi:
#      path="Test_19_incendios_1.xlsx"
#Guardas y ejecutas:
#      py crear_excel.py
#El archivo aparece en la misma carpeta que tienes el .py


from openpyxl import Workbook

headers=["Numero de pregunta","Enunciado","Opcion A","Opcion B","Opcion C","Opcion D","Solucion"]

data=[
(1,"¿Cuáles de estos materiales son considerados de fuego de Clase C?","Gasolina, petróleo, alcohol.","Gas natural, propano, butano.","Papel, cartón, madera, paja.","","b"),
(2,"Según el Reglamento de instalaciones de protección contra incendios, los sistemas de señalización luminiscente; señale la respuesta correcta.","Tendrán como función informar sobre la situación de los equipos e instalaciones de protección contra incendios, aún en caso de fallo en el suministro de alumbrado normal.","Tendrán como función informar sobre la situación de los equipos e instalaciones de protección contra incendios, de utilización manual y automática, aún en caso de fallo en el suministro de alumbrado normal.","Tendrán como función informar sobre la situación de los equipos e instalaciones de protección contra incendios, de utilización manual, aún en caso de fallo en el suministro de alumbrado normal.","","c"),
(3,"Conforme a lo que nos indica el Código Técnico de la Edificación, ¿cuáles son las dimensiones de las Zonas de Refugio para sillas de ruedas?","1,20 m x 0,80 m","1,10 m x 0,90 m","1,20 m x 1,20 m","","a"),
(4,"En el caso de que un extintor se encuentre dentro de un armario, el Reglamento de protección contra incendios indica que:","La puerta del mismo tendrá un cristal rompible con un cartel indicador situado junto al armario, de manera que sea visible y aclare la situación del extintor.","La señalización se colocará inmediatamente encima del armario y no sobre la superficie del mismo, de manera que sea visible y aclare la situación del extintor.","La señalización se colocará inmediatamente junto al armario y no sobre la superficie del mismo, de manera que sea visible y aclare la situación del extintor.","","c"),
(5,"Según la Ordenanza municipal de Protección contra incendios del Ayuntamiento de Zaragoza, señale la respuesta correcta:","Para asegurar la eficacia del Plan de Autoprotección de cada centro, se realizarán como mínimo 2 simulacros de emergencia con o sin evacuación.","El mantenimiento y/o reparación de las instalaciones de protección contra incendios deberán realizarse fuera del horario de la actividad.","Las dos respuestas anteriores son correctas.","","b"),
(6,"¿Cuáles de estos elementos pertenecen a un grupo de presión contra incendios?","Aljibe, central de alarma y vaso de expansión.","Presostato, bomba jockey, válvula de retención.","Válvula de bola, bomba principal, filtro.","","b"),
(7,"Según el DB-SI del Código Técnico de la Edificación; se debe instalar un sistema de control de humo de incendio capaz de garantizar dicho control durante la evacuación de los ocupantes, en establecimientos de Pública Concurrencia cuya ocupación exceda de:","100 personas.","500 personas.","1000 personas.","","c"),
(8,"¿Cuáles son los elementos químicos del fuego?","Oxígeno, metano, hidrógeno.","Hidrógeno, carbono, oxígeno.","Nitrógeno, carbono, oxígeno.","","b"),
(9,"En relación con la prevención de incendios ¿qué conocemos por bomba jockey?","Es una bomba perteneciente al grupo de presión encargada de mantener lleno el depósito o aljibe de la instalación contra incendios y su funcionamiento está controlado por un presostato.","Es una bomba perteneciente al grupo de presión encargada de mantener la presión de la instalación contra incendios y su funcionamiento está controlado por un flujostato.","Es una bomba perteneciente al grupo de presión encargada de mantener la presión de la instalación contra incendios y su funcionamiento está controlado por un presostato.","","c"),
(10,"Según el Reglamento de instalaciones de protección contra incendios, el personal del usuario o titular de la instalación, ¿podrá realizar tareas de mantenimiento?","Sí, según establece la tabla II del Anexo III.","No. Sólo serán efectuadas por personal del fabricante o de la empresa mantenedora.","Sí, según establecen las tablas I y III del Anexo II.","","c"),
(11,"Es el conjunto de medios, equipos y sistemas, ya sean manuales o automáticos, cuyas funciones específicas son la detección, control y/o extinción de un incendio, facilitando la evacuación de los ocupantes e impidiendo que el incendio se propague, minimizando así las pérdidas personales y materiales. Esta es la definición de;","Instalación de protección contra incendios.","Productos para la protección contra incendios.","Protección activa contra incendios.","","c"),
(12,"Para fuegos con presencia de electricidad, se utilizarán los extintores de tipo:","De CO2.","Polvo ABC polivalente.","Con hidrocarburos halogenados.","","a"),
(13,"Definición química del fuego, sería la siguiente:","Proceso de reacción química rápida, fuertemente endotérmica de oxidación-reducción.","Proceso de reacción química rápida, fuertemente exotérmica de oxidación-reducción.","Proceso de reacción química rápida, fuertemente exotérmica de oxidación-radiación.","","b"),
(14,"En el caso de que el fabricante no establezca una vida útil de las bocas de incendio equipadas, ésta será de:","15 años.","20 años.","25 años.","","b"),
(15,"Entre las pautas de actuación de un incendio, no se encuentra:","Si existe corriente de aire, nos aproximaremos al fuego con este a nuestra espalda.","Averiguar el origen del fuego y el tipo de combustible que se quema.","Retirarnos siempre dejando al fuego a nuestra espalda.","","c"),
(16,"Las mangueras de las BIE serán de las siguientes medidas:","25 mm manguera semirrígida y 45 mm manguera plana.","25 mm manguera rígida y 45 mm manguera flexible.","25 mm manguera plana y 45 mm manguera semirrígida.","","a"),
(17,"La dotación mínima en instalaciones de protección contra incendios en centros de Pública Concurrencia tendrá entre otras características","Extintores portátiles eficacia 21A 113B.","BIES. Si la superficie construida es mayor de 500 m² los equipos serán de 45mm.","Extintores portátiles eficacia 37A 143B. BIES. Si la superficie construida es mayor de 500 m² los equipos serán de 25mm.","","a"),
(18,"Las bocas de incendio equipadas se situarán:","A una distancia máxima de 5 m de las salidas del sector de incendio y a 25 m máximo entre ellas.","A una distancia máxima de 5 m de las salidas del sector de incendio y el radio de acción más 5 m.","A una distancia máxima de 5 m de las salidas del sector de incendio y a 50 m máximo entre ellas.","","c"),
(19,"Según el Reglamento de instalaciones de protección contra incendios, la situación de los pulsadores de alarma de incendio será:","La distancia máxima a recorrer desde cualquier punto de evacuación hasta alcanzar un pulsador no superará los 25 m y los pulsadores se situarán a una altura entre 80 y 120 cm.","La distancia máxima a recorrer desde cualquier punto de evacuación hasta alcanzar un pulsador no superará los 25 m y los pulsadores se situarán a una altura entre 80 y 110 cm.","La distancia máxima a recorrer desde cualquier punto de evacuación hasta alcanzar un pulsador no superará los 25 m y la parte superior de los pulsadores se situará a una altura entre 80 y 120 cm.","","c"),
(20,"Para que comience un incendio:","Se tienen que combinar un combustible y una llama.","Se tiene que combinar un combustible y un comburente y añadirle una fuente de calor.","Se tiene que combinar un combustible y un comburente.","","b"),
(21,"En los extintores de incendio, ¿cada cuánto tiempo se revisará que el indicador de presión se encuentre en la zona de operación?","Cada 3 meses.","Cada 6 meses.","Cada año.","","a"),
(22,"La señalización de las instalaciones manuales de protección contra incendios","Tendrá una medida de 594 x 594 mm cuando la distancia de observación sea mayor de 25 m.","Tendrá una medida de 420 x 420 mm cuando la distancia de observación esté comprendida entre 10 y 20 m.","Debe cumplir lo establecido en el vigente Reglamento de instalaciones de protección contra incendios aprobado por el Real Decreto 513/2017.","","c"),
(23,"En la etiqueta de un extintor, leemos lo siguiente — 47A 159B C — ¿qué nos indica dicha etiqueta?","Es la eficacia que tiene el agente extintor para cada tipo de fuego.","Es la referencia del extintor.","Indica el tipo de agente extintor que contiene.","","a"),
(24,"Si el fabricante no establece otra fecha, ¿cuál se considerará la vida útil de las señales luminiscentes?","10 años.","15 años.","20 años.","","a"),
(25,"De acuerdo con el Código Técnico de la Edificación, DB-SI, ¿cuál es la densidad de ocupación en piscinas públicas de los vasos-zonas de baño?","2 m²/persona.","3 m²/persona.","4 m²/persona.","","a"),
(26,"Según el reglamento de instalaciones de protección contra incendios, el nivel sonoro de los dispositivos acústicos:","Será de un nivel mínimo de 60 dB.","Será tal que permitirá que sea percibido en el ámbito de cada sector donde esté instalado.","Será de un nivel mínimo de 85 dB.","","b"),
(27,"La señalización de las BIE:","Se colocará junto al armario o sobre el mismo con señal luminiscente.","Se colocará encima del armario y no sobre el mismo.","Se colocará junto al armario y no sobre el mismo.","","c"),
(28,"Cuando haya que utilizar un extintor:","Se debe atacar primero a las llamas, para después ir hacia la base.","Lo primero es actuar sobre la base del fuego con movimientos verticales para apagar las llamas.","Dirigir el agente extintor a la base de fuego, actuando con movimientos en horizontal y en zigzag.","","c"),
(29,"Entre otros, ¿qué tipos de extintores nos podemos encontrar?","De agua, de presión adosada, de presión propia.","De presión propia, fijos, polvo de nitrógeno.","Móviles, portátiles, alta presión.","","a"),
(30,"Según el Código Técnico de la Edificación, DB-SI, ¿cuál es la densidad de ocupación en piscinas públicas de las zonas de estancia de público en piscinas descubiertas?","2 m²/persona.","3 m²/persona.","4 m²/persona.","","c"),
]

wb=Workbook()
ws=wb.active
ws.append(headers)
for r in data:
    ws.append(r)

path="Test_19_incendios_1.xlsx"
wb.save(path)

path