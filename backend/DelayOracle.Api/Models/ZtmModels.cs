namespace DelayOracle.Api.Models;

// The shapes of the ZTM Gdańsk JSON, limited to the fields this API reads.
//
// The departures answer: { "departures": [ ... ] }.
public record ZtmDeparturesResponse(
    List<ZtmDeparture> Departures
);

// Status is "REALTIME" when the vehicle is tracked, otherwise "SCHEDULED" with a null delay.
public record ZtmDeparture(
    string RouteShortName,
    string Headsign,
    DateTime TheoreticalTime,
    DateTime EstimatedTime,
    int? DelayInSeconds,
    string Status
);

// The stops file is an object with one entry like this per day.
public record ZtmStopsDay(
    List<ZtmStop> Stops
);

// Some stops in the file have no name; StopService leaves those out.
public record ZtmStop(
    int StopId,
    string? StopName,
    string? StopCode,
    string? ZoneName
);