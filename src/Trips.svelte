<script>
    import { onMount } from 'svelte';
    import Participants from './Participants.svelte'; // Import the new component
    import AddTrip from './AddTrip.svelte';
    import PurchaseEntry from './PurchaseEntry.svelte'
    // State for trips
    let trips = [];
    let selectedTripId ="";
    let isLoading = true;
    let error = null;

     // State for participants of the selected trip
    let selectedTripParticipants = [];
    let isLoadingParticipants = false;
    let participantsError = null;

    // Reactive variable to hold the name of the selected trip
    let selectedTripName = '';

    // State to control visibility of the participant editor component
    let showParticipantEditor = false;

    // State to control visibility of the Add Trip modal
    let showAddTripModal = false;

    onMount(async () => {
        fetchAllTrips();
    });
    async function fetchAllTrips() {
        isLoading = true;
        error = null;
        try {
            const response = await fetch('/api/v1/payback/trips');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            trips = await response.json() || [];
        } catch (e) {
            console.error("Failed to fetch trips:", e);
            error = e.message;
            trips = [];
        } finally {
            isLoading = false;
        }
    }

    function handleTripAdded() {
        showAddTripModal = false; // Close the modal
        fetchAllTrips();          // Re-fetch all trips
    }
    function handleTripSelect() {
        if (selectedTripId) {
            console.log("Selected Trip ID: ", selectedTripId)
            //function here
        } else {
            console.log("Trip selection cleared")
        }
    }
     $: if (selectedTripId) {
        fetchParticipantsForTrip(selectedTripId);
        const currentTrip = trips.find(t => t.id == selectedTripId); // Use == for potential type difference, or ensure types match
        if (currentTrip) {
            selectedTripName = currentTrip.name;
        } else {
            selectedTripName = '';
        }
    } else {
        selectedTripParticipants = []; // Clear participants if no trip is selected
        participantsError = null;
        isLoadingParticipants = false;
    }
    async function fetchParticipantsForTrip(tripId) {
        if (!tripId) return;

        isLoadingParticipants = true;
        participantsError = null;
        selectedTripParticipants = []; // Clear previous participants

        try {
            const response = await fetch(`/api/v1/payback/trips/${tripId}/participants`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            selectedTripParticipants = await response.json();
            if (!Array.isArray(selectedTripParticipants)) {
                console.warn("Participants data is not an array:", selectedTripParticipants);
                selectedTripParticipants = []; // Ensure it's an array
            }
        } catch (e) {
            console.error(`Failed to fetch participants for trip ${tripId}:`, e);
            participantsError = e.message;
        } finally {
            isLoadingParticipants = false;
        }
    }
    function handleToggleEditor() {
        showParticipantEditor = !showParticipantEditor;
        // If we are closing the editor (i.e., showParticipantEditor is now false)
        // and a trip is selected, refresh the participant list.
        if (!showParticipantEditor && selectedTripId) {
            fetchParticipantsForTrip(selectedTripId);
        }
    }
</script>

<div class="events-select-container"> 
    <label for="trip-selector">Trip:</label>
    <select
        id="trip-selector"
        bind:value={selectedTripId}
        disabled={isLoading || trips.length === 0 || error}
        >
        <option value="" disabled selected>-- Select --</option>
        <option value="" disabled selected>{isLoading ? 'Loading trips...' : (error ? 'Error loading' : (trips.length === 0 ? 'No trips available' : '-- Select Trip --'))}</option>
        {#each trips as trip (trip.id)}
            <option value={trip.id}>{trip.name}</option>
        {/each}
    </select>
    <button on:click={() => showAddTripModal = true}>Add Trip</button> <!-- Renamed button as well -->
    {#if error}
        <p class="error-message">Could not load trips: {error}</p>
    {/if}
</div>
{#if selectedTripId}
    <div class="participants-display-container">
        <h3> {selectedTripName} Participants</h3>
        {#if isLoadingParticipants}
            <p>Loading participants...</p>
        {:else if participantsError}
            <p class="error-message">Could not load participants: {participantsError}</p>
        {:else if selectedTripParticipants.length > 0}
            <ul class="assigned-participants-list">
                {#each selectedTripParticipants as participant (participant.id)}
                    <li>{participant.name} (ID: {participant.id})</li>
                {/each}
            </ul>
        {:else}
            <p>No participants currently assigned to this trip.</p>
        {/if}
        <button on:click={handleToggleEditor}>
            {showParticipantEditor ? 'Done' : 'Edit'}
        </button>
    </div>

    {#if showParticipantEditor}
        <div class="modal-overlay" on:click={handleToggleEditor} on:keypress={handleToggleEditor}>
            <div class="modal-content" on:click|stopPropagation on:keypress|stopPropagation>
                <button class="modal-close-button" on:click={handleToggleEditor}>&times;</button>
                <Participants tripId={selectedTripId} tripName={selectedTripName} on:participantAdded={handleToggleEditor} />
            </div>
        </div>
    {/if}
    <!-- Render Purchase Entry Form when a trip is selected -->
    <div class="purchase-entry-container">
        <PurchaseEntry tripId={selectedTripId} participants={selectedTripParticipants} />
    </div>
{/if}
<!-- Add Trip Modal -->
{#if showAddTripModal}
    <div class="modal-overlay" on:click={() => showAddTripModal = false}>
        <div class="modal-content" on:click|stopPropagation>
            <button class="modal-close-button" on:click={() => showAddTripModal = false}>&times;</button>
            <AddTrip on:tripAdded={handleTripAdded} on:close={() => showAddTripModal = false} />
        </div>
    </div>
{/if}
<style>
    .events-select-container {
      font-family: sans-serif;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 1.5em; /* Increased padding */
      margin: 1em auto;
      max-width: 400px; /* Adjusted width */
      background-color: #f9f9f9;
      display: flex; /* Use flex for alignment */
      flex-direction: column; /* Stack label and select */
      align-items: center; /* Center items */
    }
  
    label {
      margin-bottom: 0.5em;
      font-weight: bold;
      color: #333;
    }
  
    select {
      padding: 0.5em;
      border: 1px solid #ccc;
      border-radius: 4px;
      min-width: 200px; /* Give it some minimum width */
      font-size: 1em;
      cursor: pointer;
    }
  
    /* Style for when the select is disabled */
    select:disabled {
      background-color: #eee;
      cursor: not-allowed;
    }
  
    .no-events-message {
      margin-top: 1em;
      color: #888;
      font-style: italic;
    }
     .participants-display-container {
        font-family: sans-serif;
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 1.5em;
        margin: 1em auto;
        max-width: 400px;
        background-color: #f9f9f9;
    }

    .assigned-participants-list {
        list-style-type: disc;
        padding-left: 20px;
    }
    .assigned-participants-list li {
        margin-bottom: 0.3em;
    }
    .modal-overlay {
        position: fixed; /* Stay in place even if page scrolls */
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.6); /* Semi-transparent black */
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000; /* Ensure it's on top */
    }

    .modal-content {
        background-color: white;
        padding: 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        position: relative; /* For positioning the close button */
        min-width: 300px; /* Minimum width */
        max-width: 90%;   /* Max width relative to viewport */
        max-height: 90vh; /* Max height relative to viewport */
        overflow-y: auto; /* Add scroll if content is too tall */
    }

    .modal-close-button {
        position: absolute;
        top: 10px;
        right: 15px;
        font-size: 1.8em;
        font-weight: bold;
        color: #555;
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 0;
        line-height: 1;
    }
    .modal-close-button:hover {
        color: #000;
    }
    .purchase-entry-container {
        margin-top: 2em;
        padding: 1.5em;
        border: 1px solid #ddd;
        border-radius: 5px;
    }
  </style>