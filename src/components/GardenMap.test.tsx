import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GardenMap } from "@/components/GardenMap";

const mapbox = vi.hoisted(() => {
  const instance = { addControl: vi.fn(), on: vi.fn(), remove: vi.fn() };
  return {
    Map: vi.fn(function Map() { return instance; }),
    NavigationControl: vi.fn(function NavigationControl() {}),
    instance
  };
});

vi.mock("mapbox-gl", () => ({ default: mapbox }));
vi.mock("@mapbox/search-js-react", () => ({
  Geocoder: ({ onRetrieve, onSuggestError }: { onRetrieve: (result: { properties: { full_address: string } }) => void; onSuggestError: () => void }) => <><button onClick={() => onRetrieve({ properties: { full_address: "123 Garden Street, Montreal, QC" } })} type="button">Choose address</button><button onClick={onSuggestError} type="button">Trigger search error</button></>
}));

describe("GardenMap", () => {
  beforeEach(() => vi.clearAllMocks());

  it("explains how to configure a missing token", () => {
    render(<GardenMap accessToken="" />);
    expect(screen.getByText(/Add the Mapbox public token/)).toBeInTheDocument();
  });

  it("initializes a satellite map and reports address search results", async () => {
    const user = userEvent.setup();
    render(<GardenMap accessToken="pk.test-token" />);
    await waitFor(() => expect(mapbox.Map).toHaveBeenCalledWith(expect.objectContaining({ style: "mapbox://styles/mapbox/satellite-streets-v12" })));
    await user.click(await screen.findByRole("button", { name: "Choose address" }));
    expect(screen.getByRole("status")).toHaveTextContent("Selected: 123 Garden Street, Montreal, QC");
    await user.click(screen.getByRole("button", { name: "Trigger search error" }));
    expect(screen.getByRole("status")).toHaveTextContent("Address search is unavailable");
  });
});
