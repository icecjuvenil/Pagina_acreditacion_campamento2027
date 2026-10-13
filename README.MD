# Reconectados con la Cruz — Campamento Juvenil 2027

Sitio web para acreditar participantes y acompañantes, calcular el valor de inscripción y registrar el comprobante de transferencia.

## Ejecutar la prueba QA

1. Clonar el repositorio.
2. Abrir la carpeta en Visual Studio Code.
3. Abrir `index.html` con **Live Server**.
4. Ingresar al siguiente enlace:

### [Abrir modo QA](http://127.0.0.1:5501/index.html?qa=1)

```text
http://127.0.0.1:5501/index.html?qa=1
```

Si Live Server utiliza otro puerto, conservar ese puerto y agregar `?qa=1` al final de la dirección.

## Recorrido de prueba

1. Acreditación de la persona principal.
2. Registro del acompañante.
3. Revisión del resumen.
4. Comprobación del total de `$30.000`.
5. Carga manual de un comprobante JPG, PNG o PDF de hasta 5 MB.
6. Envío del comprobante para revisión.

El modo QA carga datos ficticios automáticamente. El archivo del comprobante debe seleccionarse manualmente por seguridad del navegador.

## Tecnologías

- HTML
- CSS
- JavaScript
- Session Storage
- Live Server

## Estado actual

Esta versión corresponde a una demostración del frontend. Los datos se almacenan temporalmente en el navegador. La conexión con Spring Boot y MySQL se desarrollará en la siguiente etapa.