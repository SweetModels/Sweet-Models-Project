# Sweet Models Admin Dashboard

Dashboard administrativo profesional para **Sweet Models** (Studios DK) construido con React, Vite y Tailwind CSS.

## 🎯 Características Principales

### 1. **Control de TRM (Tasa de Cambio Representativa)**
- Input interactivo para ingresar la TRM del día
- Cálculo automático del **Dólar Studio** con la fórmula: `TRM - $300 COP`
- Actualización en tiempo real de todos los valores

### 2. **Lógica de Negocio - Dólar Studio**
- **Fórmula**: Dólar Studio = TRM - $300
- Se utiliza para calcular los pagos de los modelos
- Interfaz clara y visual para el seguimiento

### 3. **Tabla de Modelos con Metas y Gamificación**

#### Datos de Modelos:
- 5 modelos ficticios con datos realistas (Grober, Gloria, Cindy, María, Sofía)
- Tokens acumulados por cada modelo
- Información de pago en pesos colombianos

#### Cálculos Automáticos:
- **Pago Base (Pesos)**: `Tokens × Dólar Studio`
- **Lógica de Comisión**:
  - ✅ **65%** si tokens ≥ 10,000 (Modelos Estrella)
  - ✅ **60%** si tokens < 10,000
- **Pago Final**: `Pago Base × Comisión / 100`

#### Gamificación Visual:
- 🟢 **Modelos Estrella** (≥10,000 tokens): Fila destacada en verde suave
- 🔵 **Modelos Regulares**: Fila con estilo estándar
- Insignias indicadoras de nivel de desempeño

### 4. **Dashboard Estadísticas**
- **Total Tokens**: Suma de todos los tokens acumulados
- **Total a Pagar**: Suma de los pagos finales de todos los modelos
- **Modelos Estrella**: Contador de modelos con ≥10,000 tokens

### 5. **Diseño Profesional**
- Layout moderno y limpio con barra superior (Header)
- Fondo gris suave (#F3F4F6)
- Tarjetas blancas con sombra suave
- Colores indicadores por sección (azul, verde, púrpura, naranja)
- Responsive design para desktop, tablet y mobile
- Tipografía clara y jerarquía visual

## 🏗️ Estructura del Proyecto

```
sweet-models-admin/
├── src/
│   ├── components/
│   │   ├── Header.jsx              # Encabezado del dashboard
│   │   ├── DollarStudioCard.jsx    # Tarjeta de Dólar Studio
│   │   └── ModelsTable.jsx         # Tabla de modelos y pagos
│   ├── App.jsx                     # Componente principal
│   ├── index.css                   # Estilos con Tailwind
│   └── main.jsx                    # Punto de entrada
├── tailwind.config.js              # Configuración de Tailwind
├── postcss.config.js               # Configuración de PostCSS
├── vite.config.js                  # Configuración de Vite
├── package.json
└── index.html
```

## 🚀 Tecnologías Utilizadas

- **React 18**: Librería de UI
- **Vite 7**: Bundler y servidor de desarrollo
- **Tailwind CSS 3**: Framework de estilos utilitarios
- **PostCSS**: Procesador de CSS

## 📦 Instalación y Setup

```bash
# 1. Instalar Node.js (si no está instalado)
# Descargar desde: https://nodejs.org/

# 2. Navegar al proyecto
cd sweet-models-admin

# 3. Instalar dependencias (ya está hecho)
npm install

# 4. Iniciar servidor de desarrollo
npm run dev

# 5. Abrir en navegador
# http://localhost:5174/
```

## 🎮 Uso del Dashboard

1. **Actualizar TRM**: Ingresa la TRM del día en el input azul de la izquierda
2. **Ver Dólar Studio**: Se calcula automáticamente en la tarjeta verde
3. **Revisar Modelos**: La tabla muestra todos los modelos con sus pagos
4. **Identificar Estrellas**: Las filas verdes son modelos con ≥10,000 tokens
5. **Verificar Estadísticas**: Las 3 tarjetas superiores muestran resúmenes

## 💡 Lógica de Cálculo - Ejemplo

**Entrada**: TRM = $4,200

```
Dólar Studio = $4,200 - $300 = $3,900

Modelo: Cindy
- Tokens: 15,200
- Es ≥ 10,000? SÍ → Comisión: 65%
- Pago Base: 15,200 × $3,900 = $59,280,000
- Pago Final: $59,280,000 × 65% = $38,532,000
- Estado: ⭐ Estrella
```

## 🎨 Paleta de Colores

- **Primario**: Azul (#3B82F6) - TRM Input
- **Éxito**: Verde (#10B981) - Dólar Studio, Modelos Estrella
- **Secundario**: Púrpura (#A855F7), Naranja (#F97316)
- **Neutro**: Gris (#6B7280) - Textos, fondos
- **Fondo**: Gris Claro (#F3F4F6)

## 📊 Mock Data

```javascript
[
  { id: 1, name: 'Grober', tokens: 12500 },
  { id: 2, name: 'Gloria', tokens: 8300 },
  { id: 3, name: 'Cindy', tokens: 15200 },
  { id: 4, name: 'María', tokens: 9800 },
  { id: 5, name: 'Sofía', tokens: 11000 },
]
```

## 🔄 Scripts Disponibles

```bash
npm run dev      # Iniciar servidor de desarrollo
npm run build    # Construir para producción
npm run preview  # Previsualizar build de producción
npm run lint     # Ejecutar ESLint
```

## 📝 Próximas Mejoras

- [ ] Conectar con backend API
- [ ] Base de datos real para modelos
- [ ] Autenticación de usuarios
- [ ] Historial de pagos
- [ ] Gráficos y analytics
- [ ] Notificaciones en tiempo real
- [ ] Exportar reportes a PDF/Excel
- [ ] Dashboard móvil

## 👤 Autor

**Studios DK** - Sweet Models Admin Dashboard

## 📄 Licencia

Privado - Todos los derechos reservados
