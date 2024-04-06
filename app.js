/*cspell:disable */

const getTypeColor = type => {
  const normal = '#F5F5F5'
  return {
    normal,
    fire: '#F27156',
    grass: '#93D776',
    electric: '#FFD759',
    ice: '#93E5FF',
    water: '#59AEFF',
    ground: '#E5C976',
    rock: '#C9BD85',
    fairy: '#FFBDFF',
    poison: '#BC76AE',
    bug: '#BCC949',
    ghost: '#8585C9',
    dragon: '#9385F2',
    psychic: '#FF76AE',
    flying: '#85AEFF',
    fighting: '#C97668'
  }[type] || normal
}


 // search function currently not working lol //
 const searchInput = document.getElementById('search');
 const pokemonsList = document.querySelector('[data-js="pokemons-list"]');
 const pokemonDataList = [];
 
 // Add an event listener to the search input
 searchInput.addEventListener('keyup', e => {
   let currentValue = e.target.value.toLowerCase();
   let pokemons = Array.from(pokemonsList.children);
 
   pokemons.forEach(pokemon => {
     if (pokemon.textContent.toLowerCase().includes(currentValue)) {
       pokemon.style.display = 'block';
     } else {
       pokemon.style.display = 'none';
     }
   });
 
   // Check if the searched Pokémon is not rendered
   if (!pokemons.some(pokemon => pokemon.textContent.toLowerCase().includes(currentValue))) {
     searchPokemonFromAPI(currentValue);
   }
 });
 
 const searchPokemonFromAPI = async (pokemonName) => {
   try {
     const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
     
     if (!response.ok) {
       throw new Error('Pokémon not found');
     }
 
     const pokemonData = await response.json();
     // Perform any actions with the fetched Pokémon data
     console.log(pokemonData);
   } catch (error) {
     console.log('Error:', error);
   }
 };
 




const getOnlyFulfilled = async ({ func, arr}) => {
  const promises = arr.map(func)
  const responses = await Promise.allSettled(promises)
  return responses.filter(response => response.status === 'fulfilled')
}

const getPokemonsType = async pokeApiResults => {
  const fulfilled = await getOnlyFulfilled({ arr: pokeApiResults, func: result => fetch(result.url) })
  const pokePromises = fulfilled.map(url => url.value.json())
  const pokemons = await Promise.all(pokePromises)
  return pokemons.map(fulfilled => fulfilled.types.map(info => DOMPurify.sanitize(info.type.name) ))
}

/* gets penultimate id of the arrays */
const getPokemonsIds = pokeApiResults => pokeApiResults.map(({ url }) => {
  const urlAsArray = DOMPurify.sanitize(url).split('/')
  return urlAsArray.at(urlAsArray.length - 2)
})

const getPokemonsImgs = async ids => {
  const fulfilled = await getOnlyFulfilled({ arr: ids, func: id => fetch(`./assets/img/${id}.png`) })
  return fulfilled.map(response => response.value.url)
}


const limit = 15
let offset = 0

const getPokemons = async () => {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`)
    
    if (!response.ok) {
      throw new Error('It was not possible to get information')
    }

    const { results:pokeApiResults } = await response.json()
    const types = await getPokemonsType(pokeApiResults)
    const ids = getPokemonsIds(pokeApiResults)
    const imgs = await getPokemonsImgs(ids)
    const pokemons = ids.map ((id, i) => ({id, name: pokeApiResults[i].name, types: types[i], imgUrl: imgs[i]}))

    offset += limit
    return pokemons
  } catch (error) {
    console.log('Something went wrong:', error)
  }
}


const renderPokemons = pokemons => {
  const ul = document.querySelector('[data-js="pokemons-list"]');
  const fragment = document.createDocumentFragment()

  pokemons.forEach(({ id, name, types, imgUrl }) => {
    const li = document.createElement('li')
    const img = document.createElement('img')
    const nameContainer = document.createElement('h2')
    const typeContainer = document.createElement('p')
    const [firstType] = types

    img.setAttribute('src', imgUrl)
    img.setAttribute('alt', name)
    img.setAttribute('class', 'card-image')
    li.setAttribute('class', `card ${firstType}`)
    li.style.setProperty('--type-color', getTypeColor(firstType))

    nameContainer.textContent = `${id}. ${name[0].toUpperCase()}${name.slice(1)}`
    typeContainer.textContent = types.length > 1 ? types.join(' | ') : firstType
    li.append(img, nameContainer, typeContainer)

    fragment.append(li)
  })

  ul.append(fragment)
  
}

const observeLastPokemon = pokemonsObserver => {
  const lastPokemon = document.querySelector('[data-js="pokemons-list"]').lastChild
  pokemonsObserver.observe(lastPokemon)
}

const handleNextPokemonsRender = async () => {
  const pokemonsObserver = new IntersectionObserver(async ([lastPokemon], observer) => {
    if (!lastPokemon.isIntersecting) {
      return
    }

    observer.unobserve(lastPokemon.target)

    if (offset === 150) {
      return
    }

    const pokemons = await getPokemons()
    renderPokemons(pokemons)
    observeLastPokemon(pokemonsObserver)
  })

  observeLastPokemon(pokemonsObserver)
}


const handlePageLoaded = async () => {
  const pokemons = await getPokemons()
  pokemonDataList.push(...pokemons);
  
  renderPokemons(pokemons)
  handleNextPokemonsRender()
}

handlePageLoaded()


