# Pokédex - Kanto Gen 1 (PokeAPI)

Proyecto de Pokédex interactiva que se conecta a la **PokeAPI** para mostrar los 151 primeros Pokémon de la primera generación (Kanto).

## Características principales

- **Conexión a PokeAPI**: Obtiene la información en tiempo real desde `https://pokeapi.co/api/v2/pokemon`.
- **Los 151 primeros Pokémon**: Carga completa de la primera generación.
- **Card interactiva por Pokémon**:
  - **Sprites por delante y por detrás**: Muestra las dos vistas (frontal y dorsal) pixel-art con efecto visual de realce.
  - **Nombre**: Formateado y con estilo característico.
  - **Número de Pokédex**: Formato oficial `#001` a `#151`.
  - **Tipo(s)**: Insignias de tipos (Planta, Veneno, Fuego, Agua, etc.) con sus colores oficiales.
  - **Estadísticas adicionales**: Altura y peso de cada Pokémon.
- **Color dinámico según el tipo**: El fondo de cada tarjeta se adapta automáticamente al color del tipo principal (o un degradado suave si el Pokémon posee dos tipos).
- **Buscador en tiempo real**: Búsqueda instantánea por nombre o número de Pokédex.
- **Filtro por tipo**: Selector desplegable para filtrar por cualquiera de los tipos elementales.
- **Caché en LocalStorage**: Guarda los datos localmente tras la primera carga para navegación instantánea.
- **Diseño responsivo**: Adaptado para móviles, tablets y ordenadores de escritorio.

## Cómo ejecutar

Simplemente abre el archivo `index.html` en tu navegador web favorito:

```bash
# O iniciar un servidor local con Python:
python3 -m http.server 8080
```

Luego accede a `http://localhost:8080` en tu navegador.
