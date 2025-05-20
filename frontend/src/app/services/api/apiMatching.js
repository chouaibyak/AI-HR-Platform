// services/api/apiMatching.js
import axios from 'axios';

export default axios.create({
  baseURL: 'http://localhost:5004', // MatchingService
});
