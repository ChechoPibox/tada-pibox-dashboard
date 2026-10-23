// Matriz oficial de metas por punto, día y turno (Hoja PRODUCTIVIDAD)
// Actualizado con MDE-TD-BELLO y todas las tiendas activas desde Google Sheets GID 723253237
let PRODUCTIVITY_TARGETS = [
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 3.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 6.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 7.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 6.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 6.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 3.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 6.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 2.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 3.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 4.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 2.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 2.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 3.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 2.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 1.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 6.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 4.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 4.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 14.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 5.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 4.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 8.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 5.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 1.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 3.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 5.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5416666666666666",
    "start_minutes": 780,
    "target_packages": 36.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 10.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 7.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 7.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 6.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 4.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 6.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 8.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 15.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 8.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 3.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 5.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 4.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 4.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 4.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 5.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 12.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Lunes",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 14.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 3.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 3.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 8.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 7.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 1.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 3.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 4.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 2.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 3.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 1.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 3.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 10.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 17.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TY-CLARET - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 2.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 6.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 5.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 13.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 6.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 5.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 14.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 12.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 14.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 22.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 7.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TY-CLARET - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 2.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 12.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 5.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 5.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 15.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 12.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 12.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Martes",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 18.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 6.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 3.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 2.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 6.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 3.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 3.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 5.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 5.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 3.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 7.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 6.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 11.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 5.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 12.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5416666666666666",
    "start_minutes": 780,
    "target_packages": 6.0
  },
  {
    "store": "La Tapa",
    "weekday": "Miercoles",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 5.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 8.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 6.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 9.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 8.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 8.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 12.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 4.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 15.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 9.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 5.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 11.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 10.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 8.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 16.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 14.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 12.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 16.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 11.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 16.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 16.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 13.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Miercoles",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 15.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.041666666666666664",
    "start_minutes": 60,
    "target_packages": 7.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 7.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 3.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 8.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 10.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 11.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 21.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 6.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 6.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 3.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 5.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 13.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 6.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 3.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 8.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 3.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 5.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 14.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 5.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 6.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 2.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5416666666666666",
    "start_minutes": 780,
    "target_packages": 5.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5416666666666666",
    "start_minutes": 780,
    "target_packages": 18.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5416666666666666",
    "start_minutes": 780,
    "target_packages": 10.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 4.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 8.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 5.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 9.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 8.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 5.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 10.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 5.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 7.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 7.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 8.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 5.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 11.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 6.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 12.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 10.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 9.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 13.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 10.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 7.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 4.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 12.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 8.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 7.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 13.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 9.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TD-SANFERNANDO - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 8.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Jueves",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 10.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.041666666666666664",
    "start_minutes": 60,
    "target_packages": 11.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 3.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 6.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 9.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 6.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 3.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 2.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 4.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 4.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 10.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 5.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 6.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 14.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 5.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 6.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 5.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 8.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5416666666666666",
    "start_minutes": 780,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5416666666666666",
    "start_minutes": 780,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5416666666666666",
    "start_minutes": 780,
    "target_packages": 13.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 6.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 10.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 10.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 6.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 10.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 3.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 14.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 7.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 6.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 5.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 7.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 14.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 8.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 7.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 6.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 8.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 8.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 13.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 10.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 6.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 13.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 13.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 14.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 15.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 5.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 6.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 13.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 13.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 15.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 9.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 9.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 9.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 12.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 7.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 14.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 7.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 9.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 12.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.9895833333333334",
    "start_minutes": 1425,
    "target_packages": 12.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.9895833333333334",
    "start_minutes": 1425,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.9930555555555556",
    "start_minutes": 1430,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Viernes",
    "start_fraction": "0.9166666666666666",
    "start_minutes": 1320,
    "target_packages": 14.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.041666666666666664",
    "start_minutes": 60,
    "target_packages": 13.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 3.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 9.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 11.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 13.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 6.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 8.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 9.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 9.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 6.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 9.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 15.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 12.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 11.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 14.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 6.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 11.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 10.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 4.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 8.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 10.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 11.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 14.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 9.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 13.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 11.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 12.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 12.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 12.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 10.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 9.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 8.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 10.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 10.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 11.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 14.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 15.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 11.0
  },
  {
    "store": "La Tapa",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 16.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 5.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 4.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 15.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 12.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 15.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 13.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 12.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 12.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 6.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 9.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 13.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 13.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 11.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 12.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 10.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 13.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 14.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 16.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 16.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 14.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 17.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 11.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 15.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 14.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 14.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 14.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 16.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 11.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 14.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 13.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 9.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 12.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 14.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 15.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 14.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 13.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 13.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 14.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.9895833333333334",
    "start_minutes": 1425,
    "target_packages": 18.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.9895833333333334",
    "start_minutes": 1425,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.3333333333333333",
    "start_minutes": 480,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.3333333333333333",
    "start_minutes": 480,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.9930555555555556",
    "start_minutes": 1430,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.25",
    "start_minutes": 360,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Sabado",
    "start_fraction": "0.9166666666666666",
    "start_minutes": 1320,
    "target_packages": 16.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.041666666666666664",
    "start_minutes": 60,
    "target_packages": 6.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 9.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 11.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 12.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 12.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 3.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 10.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 8.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 14.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 7.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 7.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 17.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 8.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 20.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 15.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 20.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 14.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 12.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.4583333333333333",
    "start_minutes": 660,
    "target_packages": 13.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 10.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 13.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 6.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 20.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 15.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 12.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 11.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5208333333333334",
    "start_minutes": 750,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5416666666666666",
    "start_minutes": 780,
    "target_packages": 6.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5416666666666666",
    "start_minutes": 780,
    "target_packages": 8.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 9.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 13.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 11.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 11.0
  },
  {
    "store": "La Tapa",
    "weekday": "Domingo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 8.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 2.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 8.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 8.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 5.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "MDE-TD-BELLO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "SAM-TD-LIBERTADOR - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6458333333333334",
    "start_minutes": 930,
    "target_packages": 8.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 14.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 17.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 6.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 6.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 10.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 6.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TY-SOACHA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 15.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 14.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 19.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 19.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 9.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 12.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 12.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 12.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 10.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 7.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 10.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.75",
    "start_minutes": 1080,
    "target_packages": 11.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 11.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.8333333333333334",
    "start_minutes": 1200,
    "target_packages": 14.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.9895833333333334",
    "start_minutes": 1425,
    "target_packages": 9.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.3333333333333333",
    "start_minutes": 480,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TY-BOSA - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.3333333333333333",
    "start_minutes": 480,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Domingo",
    "start_fraction": "0.25",
    "start_minutes": 360,
    "target_packages": 19.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 7.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 3.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 5.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 2.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 4.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.375",
    "start_minutes": 540,
    "target_packages": 3.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.4166666666666667",
    "start_minutes": 600,
    "target_packages": 6.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 6.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 5.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 4.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 6.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 4.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 3.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.5",
    "start_minutes": 720,
    "target_packages": 3.0
  },
  {
    "store": "SAM-TD-RODADERO - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 7.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 3.0
  },
  {
    "store": "BAQ-TD-HIPODROMO - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 5.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.5833333333333334",
    "start_minutes": 840,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-PIEDECUESTA - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 6.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 5.0
  },
  {
    "store": "BUC-TY-AURORA - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 3.0
  },
  {
    "store": "MDE-TY-BELEN - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 4.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 10.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 4.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.625",
    "start_minutes": 900,
    "target_packages": 5.0
  },
  {
    "store": "BOG-TY-QUINTAPAREDES - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 1.0
  },
  {
    "store": "BUC-TY-PROVENZA - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 6.0
  },
  {
    "store": "BOG-TD-MARTIRES - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 3.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.6666666666666666",
    "start_minutes": 960,
    "target_packages": 3.0
  },
  {
    "store": "CAL-TY-OLIMPICO - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 7.0
  },
  {
    "store": "CAL-TD-FLORESTA - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 8.0
  },
  {
    "store": "CAL-TY-CIUDADJARDIN - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 5.0
  },
  {
    "store": "CAL-TD-LIMONAR - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.7083333333333334",
    "start_minutes": 1020,
    "target_packages": 8.0
  },
  {
    "store": "BOG-TD-CRA91 - 830094751-7",
    "weekday": "Lunes Festivo",
    "start_fraction": "0.3333333333333333",
    "start_minutes": 480,
    "target_packages": 4.0
  }
];
