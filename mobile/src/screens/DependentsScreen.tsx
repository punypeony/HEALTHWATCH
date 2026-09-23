import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { listDependents } from "../api";
import { ScreenStatus } from "../components/ScreenStatus";
import { useFocusedQuery } from "../hooks/useFocusedQuery";
import { placeholder } from "../theme/placeholder";
import type { AppStackParamList, Dependent } from "../types";

type Props = NativeStackScreenProps<AppStackParamList, "Dependents">;

export function DependentsScreen({ navigation }: Props) {
  const load = useCallback(() => listDependents(), []);
  const dependents = useFocusedQuery(load);

  if (dependents.status === "loading") {
    return <ScreenStatus title="Dependents" message="Loading dependents..." loading />;
  }

  if (dependents.status === "error") {
    return (
      <ScreenStatus
        title="Dependents"
        message={dependents.message}
        actionLabel="Retry"
        onAction={dependents.retry}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={placeholder.screen}>
      <Text style={placeholder.title}>Dependents</Text>
      {dependents.data.length === 0 ? (
        <Text>No dependents yet.</Text>
      ) : (
        dependents.data.map((dependent) => (
          <DependentCard
            key={dependent.id}
            dependent={dependent}
            onOpen={() =>
              navigation.navigate("Dependent", {
                dependentId: dependent.id,
                dependentName: dependent.name,
              })
            }
            onEdit={() => navigation.navigate("DependentForm", { dependentId: dependent.id })}
          />
        ))
      )}
      <Pressable
        onPress={() => navigation.navigate("DependentForm")}
        style={placeholder.button}
      >
        <Text>Add dependent</Text>
      </Pressable>
      <Pressable onPress={dependents.retry} style={placeholder.button}>
        <Text>Refresh</Text>
      </Pressable>
    </ScrollView>
  );
}

function DependentCard({
  dependent,
  onOpen,
  onEdit,
}: {
  dependent: Dependent;
  onOpen: () => void;
  onEdit: () => void;
}) {
  return (
    <View style={placeholder.card}>
      <Text>{dependent.name}</Text>
      <Text>
        {dependent.age} years · {dependent.sex}
      </Text>
      <View style={placeholder.row}>
        <Pressable onPress={onOpen} style={placeholder.button}>
          <Text>Open</Text>
        </Pressable>
        <Pressable onPress={onEdit} style={placeholder.button}>
          <Text>Edit</Text>
        </Pressable>
      </View>
    </View>
  );
}
