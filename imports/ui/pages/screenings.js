import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';

import { Films } from './../../api/films/films.js';

import './screenings.html';

Template.screenings.helpers({
  films() {
    return get_future_films(false);
  },
  states_options(films) {
    const states = [];

    _.each(films, function (film) {
      _.each(film.screening, function (screening) {
        if (screening.uf && in_future(screening['date']) && !screening['draft']) {
          states.push(screening.uf);
        }
      });
    });

    return _.uniq(states);
  },
  cities_options(films) {
    const cities = [];

    _.each(films, function (film) {
      _.each(film.screening, function (screening) {
        if (screening.city && in_future(screening['date']) && !screening['draft']) {
          cities.push(screening.city);
        }
      });
    });

    return _.uniq(cities);
  },
  filtered_films() {
    // filmes com sessões futuras e obedecendo filtros
    let films = get_future_films(true),
      screenings,
      future_screenings = [],
      filtered_films = [];

    _.each(films, function (film) {
      screenings = film.future_screenings || [];

      _.each(screenings, function (screening) {
        // applica filtros
        let filtered_city = Session.get('city'),
          filtered_state = Session.get('state'),
          filtered_month = Session.get('month'),
          filtered_title = Session.get('title');

        if ((!filtered_city || screening['city'] == filtered_city) &&
            (!filtered_state || screening['uf'] == filtered_state) &&
            (!filtered_month || screening['date'].getMonth()+1 == filtered_month) &&
            (!filtered_title || screening['title'] == filtered_title) &&
            !screening['draft']) {
          future_screenings.push(screening);
        }
      });

      if (future_screenings.length > 0) {
        film.future_screenings = _.sortBy(future_screenings, 'date');
        filtered_films.push(film);
        future_screenings = [];
      }
    });

    return filtered_films;
  },
});

Template.screenings.onRendered(() => {
  // Deixa o mês ativado.
  $('.btn-datepicker').click(function () {
    $('.btn-datepicker').removeClass('active');
    $(this).addClass('active');
  });

  // Trigger pra carregar mais sessões
  $('#loadMoreContainer').click(function () {

  });

});

Template.screenings.events({
  'change #city-selector': function (e) {
    const city = $(e.currentTarget).val();
    Session.set('city', city);
  },
  'change #st-selector': function (e) {
    const state = $(e.currentTarget).val();
    Session.set('state', state);
  },
  'change #title-selector': function (e) {
    const title = $(e.currentTarget).val();
    Session.set('title', title);
  },
  'click .btn-datepicker': function (e) {
    const month = $(e.currentTarget).data('month');
    Session.set('month', month);
  },
  'click #film-selector': function (e) {
    const film = $(e.currentTarget).val();
    Session.set('film', film);
  },
});

/* Pega filmes que tem sessão no futuro
  *
  * @return Array de filmes
  */
function get_future_films(filtered) {
  // retorna filmes com sessões futuras
  let films,
    screenings,
    future_screenings = [],
    future_films = [];

  films = (Session.get('film') && filtered) ?
    Films.find({ title: Session.get('film') }) :
    Films.active();

  films = films.fetch();

  _.each(films, function (film) {
    screenings = film.screening || [];

    _.each(screenings, function (screening) {
      if (in_future(screening.date)) {
        future_screenings.push(screening);
      }
    });

    if (future_screenings.length > 0) {
      film.future_screenings = future_screenings;
      future_films.push(film);
      future_screenings = [];
    }
  });

  return future_films;
}

function in_future(date) {
  const today = new Date();

  return (date.getTime() > today.getTime());
}
