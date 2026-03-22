from typing import Optional

def get_query_text_node_cpu(
    node_id: str,
    time_delta: Optional[str] = "-5m",
    start_time: Optional[str] = None,
    end_time: Optional[str] = None
) -> str:

    is_custom_range = start_time is not None and end_time is not None
    range_text = ""

    if is_custom_range:
        range_text = f"|> range(start: {start_time}, stop: {end_time})"
        pass
    elif time_delta is not None:
        range_text = f"|> range(start: {time_delta})"
        pass
    else:
        raise ValueError("Must provide either a time_delta or a custom range (start_time and end_time).")

    query_text = f"""from(bucket: \"blade-resource\")
        {range_text}
        |> filter(fn: (r) => r[\"_measurement\"] == \"cpu\")
        |> filter(fn: (r) => r[\"_field\"] == \"usage_system\" or r[\"_field\"] == \"usage_user\")
        |> filter(fn: (r) => r[\"cpu\"] == \"cpu-total\")
        |> filter(fn: (r) => r[\"host\"] == \"{node_id}\")
        |> yield(name: \"mean\")"""

    return query_text

def get_query_text_node_mem(
    node_id: str,
    time_delta: Optional[str] = "-5m",
    start_time: Optional[str] = None,
    end_time: Optional[str] = None
) -> str:

    is_custom_range = start_time is not None and end_time is not None
    range_text = ""

    if is_custom_range:
        range_text = f"|> range(start: {start_time}, stop: {end_time})"
        pass
    elif time_delta is not None:
        range_text = f"|> range(start: {time_delta})"
        pass
    else:
        raise ValueError("Must provide either a time_delta or a custom range (start_time and end_time).")

    query_text = f"""from(bucket: \"blade-resource\")
        {range_text}
        |> filter(fn: (r) => r[\"_measurement\"] == \"mem\")
        |> filter(fn: (r) => r[\"_field\"] == \"used\" or r[\"_field\"] == \"total\")
        |> filter(fn: (r) => r[\"host\"] == \"{node_id}\")"""

    return query_text
