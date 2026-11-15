namespace DelayOracle.Api.Models;

// What the API sends to the worker's POST /predict.
public record WorkerDeparture(DateTime ScheduledTime, int CurrentDelayS);
public record WorkerPredictRequest(DateTime ObservedAt, List<WorkerDeparture> Departures);

// What the worker answers.
public record WorkerPredictResponse(List<int>? PredictedDelaysS);

// The parts of the worker's model card that the API passes on.
public record ModelCardRows(int Train, int Test);
public record ModelCardMae(double Model, double Baseline);
public record ModelCardResponse(
    string Model, 
    List<string> Features, 
    ModelCardRows Rows, 
    ModelCardMae MaeSeconds, 
    DateTime TrainedAtUtc
);