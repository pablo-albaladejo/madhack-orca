import type { AgentCard } from '@a2a-js/sdk'

export const agentCard: AgentCard = {
  name: 'Travel Provider',
  description: 'Provides travel services: weather forecasts, restaurant recommendations, flight search, hotel search, and booking management for any destination.',
  url: 'http://localhost:3000/',
  version: '1.0.0',
  capabilities: {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false,
  },
  defaultInputModes: ['text'],
  defaultOutputModes: ['text'],
  skills: [
    {
      id: 'weather',
      name: 'Weather Forecast',
      description: 'Get current weather and forecast for a city',
      tags: ['weather', 'forecast', 'temperature'],
      examples: ['What\'s the weather in Madrid?', 'Temperature in Barcelona this weekend'],
    },
    {
      id: 'restaurants',
      name: 'Restaurant Search',
      description: 'Find restaurants in a city using OpenStreetMap data',
      tags: ['restaurants', 'food', 'dining'],
      examples: ['Find restaurants in Madrid', 'Best places to eat in Barcelona'],
    },
    {
      id: 'flights',
      name: 'Flight Search',
      description: 'Search for flights between cities',
      tags: ['flights', 'airlines', 'travel'],
      examples: ['Flights from Barcelona to Madrid', 'Find flights to Paris next Friday'],
    },
    {
      id: 'hotels',
      name: 'Hotel Search',
      description: 'Search for hotels in a city',
      tags: ['hotels', 'accommodation', 'lodging'],
      examples: ['Hotels in Madrid', 'Find accommodation in Barcelona for 2 nights'],
    },
    {
      id: 'booking',
      name: 'Travel Booking',
      description: 'Book or cancel flights and hotels. Returns confirmation ID.',
      tags: ['booking', 'reservation', 'cancel', 'CRUD'],
      examples: ['Book flight IB3214 for 2 passengers', 'Cancel booking CONF-48291'],
    },
  ],
}
