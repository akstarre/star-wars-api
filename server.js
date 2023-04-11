const express = require('express');
const axios = require('axios');
const ejs = require('ejs');

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/search', (req, res) => {
  const searchTerm = req.query.term;
  axios.get(`https://swapi.dev/api/people/?search=${searchTerm}`)
    .then(response => {
      const results = response.data.results;

      //For each character, get the homeworld name
      const promises = results.map(result => {
        const homeworldPromise = axios.get(result.homeworld)
          .then(response => response.data.name)
          .catch(error => {
            console.log(error)
            return null
          })

        const speciesPromise = axios.get(result.species[0])
          .then(response => response.data.name)
          .catch(error => {
            console.log(error)
            return null
          })

        const starshipPromise = axios.get(result.starships[0])
          .then(response => response.data.name)
          .catch(error => {
            console.log(error)
            return "This character doesn't own a starship."
          })

        const vehiclePromise = axios.get(result.vehicles[0])
          .then(response => response.data.name)
          .catch(error => {
            console.log(error)
            return "This character doesn't own a vehicle."
          })

          const imagePromise = axios.get(`https://swapi.dev/api/people/${result.url.split('/')[5]}/`)
          .then(response => `https://starwars-visualguide.com/assets/img/characters/${response.data.url.split('/')[5]}.jpg`)
          .catch(error => {
            console.log(error)
            return null
          })

        return Promise.all([homeworldPromise, speciesPromise, starshipPromise, vehiclePromise, imagePromise])
          .then(values => {
            const [homeworld, species, starship, vehicle, image] = values;
            result.homeworld = homeworld;
            result.species = species;
            result.starship = starship;
            result.vehicle = vehicle;
            result.image = image;
         
            return result
          })
          .catch(error => {
            console.log(error)
            return result;
          })
      })

      //wait for all promises to resolve before rendering page
      Promise.all(promises)
        .then(results => {
          res.render('results', { results });
        })
        .catch(error => {
          console.log(error);
          res.render('error');
        });

    })
    .catch(error => {
      console.log(error);
      res.render('error');
    });
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server started.');
});