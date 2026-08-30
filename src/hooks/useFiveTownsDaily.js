import { useQuery } from '@tanstack/react-query';
import {
  fetchFiveTownsJewishTimes,
  fetchFiveTownsTraffic,
  fetchFiveTownsWeather,
} from '@/services/fiveTownsDailyService';

const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

function queryData(query, sourceUrl) {
  if (query.data) return query.data;
  return {
    status: query.isPending ? 'loading' : 'unavailable',
    data: null,
    incidents: [],
    sourceUrl,
  };
}

export default function useFiveTownsDaily() {
  const weatherQuery = useQuery({
    queryKey: ['five-towns-daily', 'weather'],
    queryFn: ({ signal }) => fetchFiveTownsWeather({ signal }),
    staleTime: FIVE_MINUTES,
    refetchInterval: 15 * 60 * 1000,
    retry: 1,
  });
  const jewishTimesQuery = useQuery({
    queryKey: ['five-towns-daily', 'jewish-times', new Date().toDateString()],
    queryFn: () => fetchFiveTownsJewishTimes(),
    staleTime: ONE_HOUR,
    retry: 1,
  });
  const trafficQuery = useQuery({
    queryKey: ['five-towns-daily', 'traffic'],
    queryFn: () => fetchFiveTownsTraffic(),
    staleTime: FIVE_MINUTES,
    refetchInterval: 5 * 60 * 1000,
    retry: 1,
  });

  return {
    weather: queryData(weatherQuery, 'https://open-meteo.com/'),
    jewishTimes: queryData(jewishTimesQuery, 'https://www.hebcal.com/'),
    traffic: queryData(trafficQuery, 'https://511ny.org/'),
    isLoading: weatherQuery.isPending && jewishTimesQuery.isPending && trafficQuery.isPending,
    refresh: () => Promise.all([
      weatherQuery.refetch(),
      jewishTimesQuery.refetch(),
      trafficQuery.refetch(),
    ]),
  };
}
