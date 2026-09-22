export type HealthResponse = {
  status: "ok";
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export type RootStackParamList = {
  Health: undefined;
  Scanner: undefined;
};
