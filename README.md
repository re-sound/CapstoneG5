# Proyecto APT – Atreu Temperature  
Sistema de Monitoreo y Control de Temperaturas para Fruta de Exportación  

---

## Descripción del Proyecto

El Proyecto APT – Atreu Temperature consiste en el diseño e implementación de un sistema web moderno que permite monitorear, visualizar y gestionar en tiempo real las temperaturas de túneles y cámaras frigoríficas utilizadas en el proceso de conservación de fruta de exportación.  

Actualmente, muchas empresas del rubro agrícola utilizan sistemas obsoletos (por ejemplo, aplicaciones en Flash desarrolladas en 2008) o registros manuales, lo que dificulta la trazabilidad, la detección temprana de fallos y el aseguramiento de la calidad de la fruta. Este proyecto responde a la necesidad de digitalizar y modernizar la gestión, asegurando confiabilidad, escalabilidad y accesibilidad para operadores, supervisores y clientes.  

---

## Objetivos

### General  
Diseñar e implementar un sistema de monitoreo web interactivo que centralice la información de sensores en túneles y cámaras frigoríficas, generando alarmas, reportes e históricos para garantizar la calidad de la fruta exportada.  

### Específicos  
- Simular e integrar sensores IoT (temperatura ambiente, retorno, interior y exterior de palets).  
- Desarrollar una interfaz web moderna e interactiva para visualizar túneles con sus sensores en tiempo real.  
- Implementar alertas automáticas cuando las temperaturas salgan de los rangos ideales definidos por fruta.  
- Permitir la visualización de históricos y reportes exportables en PDF/Excel.  
- Incorporar procesos de gestión (crear, pausar, modificar, finalizar) para cada túnel.  
- Asegurar que el sistema sea escalable, seguro y mantenible para futuros despliegues.  

---

## Tecnologías Utilizadas

- Frontend:  
  - React con Vite y TypeScript  
  - TailwindCSS para interfaz moderna y responsive  
  - ECharts para gráficos interactivos con zoom, tooltip y exportación  

- Backend (próximas fases):  
  - Node.js con Express o PHP con MySQL, según integración con cliente  
  - API REST para conexión con sensores IoT  

- Otros:  
  - Control de versiones con Git y GitHub  
  - Herramientas de gestión como Trello o Jira  
  - Librerías adicionales: html2canvas, jspdf (para exportación de reportes) 
