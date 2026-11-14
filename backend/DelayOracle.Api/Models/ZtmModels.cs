namespace DelayOracle.Api.Models;

public record ZtmDeparturesResponse(
    List<ZtmDeparture> Departures
);

public record ZtmDeparture(
    string RouteShortName,
    string Headsign,
    DateTime TheoreticalTime,
    DateTime EstimatedTime,
    int? DelayInSeconds,
    string Status
);

public record ZtmStopsDay(
    List<ZtmStop> Stops
);

public record ZtmStop(
    int StopId,
    string? StopName,
    string? StopCode,
    string? ZoneName
);