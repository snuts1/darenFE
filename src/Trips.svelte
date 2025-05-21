<script>
    import { onMount } from 'svelte';
    import Participants from './Participants.svelte'; // Import the new component
    import AddTrip from './AddTrip.svelte';
    import PurchaseEntry from './PurchaseEntry.svelte';
	import PurchaseLog from './PurchaseLog.svelte';
    import StatusChart from './StatusChart.svelte';
    
    // State for trips
    let trips = [];
    let selectedTripId ="";
    let isLoading = true;
    let error = null;

    // State for participants of the selected trip
    let selectedTripParticipants = [];
    let isLoadingParticipants = false;
    let participantsError = null;
    let purchaseLogComponent; // To bind to the PurchaseLog instance
    let purchaseEntryComponent;
    let statusChartComponent; // To bind to the StatusChart instance

    // Reactive variable to hold the name of the selected trip
    let selectedTripName = '';

    // State to control visibility of the participant editor component
    let showParticipantEditor = false;

    // State to control visibility of the Add Trip modal
    let showAddTripModal = false;

    let isParticipantsExpanded = false; // State to control if participants list is expanded
    let isLogExpanded = false;

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
    function handlePurchaseAdded() {
        if (purchaseLogComponent) {
            purchaseLogComponent.fetchPurchases(); // Call the exposed method
        }
        if (statusChartComponent) {
            statusChartComponent.fetchBalances(); // Call the exposed method on StatusChart
        }
    } 

    function handleTripAdded() {
        showAddTripModal = false; // Close the modal
        fetchAllTrips();          // Re-fetch all trips
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
    <button class="add-trip-button" on:click={() => showAddTripModal = true}>+</button> <!-- Renamed button as well -->
    {#if error}
        <p class="error-message">Could not load trips: {error}</p>
    {/if}
</div>
{#if selectedTripId}
   <div class="collapsible-participants-container">
        <div class="collapsible-header" on:click={() => isParticipantsExpanded = !isParticipantsExpanded}>
            <h3>{selectedTripName} Participants</h3>
            <span class="arrow" class:expanded={isParticipantsExpanded}>&#11206;</span> <!-- Down arrow -->
        </div>
        {#if isParticipantsExpanded}
            <!-- Content to collapse/expand -->
            <div class="collapsible-content">
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
        {/if}
    </div>

    {#if showParticipantEditor}
        <div class="modal-overlay" on:click={handleToggleEditor} on:keypress={handleToggleEditor}>
            <div class="modal-content" on:click|stopPropagation on:keypress|stopPropagation>
                <button class="modal-close-button" on:click={handleToggleEditor}>&times;</button>
                <Participants tripId={selectedTripId} tripName={selectedTripName} on:participantAdded={handleToggleEditor} />
            </div>
        </div>
    {/if}
     <div class="add-purchase-action-bar">
        <button 
            class="global-add-purchase-button" 
            on:click={() => purchaseEntryComponent?.openModal()}
            disabled={!selectedTripId || selectedTripParticipants.length === 0}
        >
            + Purchase
        </button>
        {#if selectedTripParticipants.length === 0 && selectedTripId}
            <p class="small-note">Add participants to this trip to enable purchases.</p>
        {/if}
    </div>
    <!-- Render Purchase Entry Form when a trip is selected -->
    <div class = "status-chart-wrapper">
        <StatusChart bind:this={statusChartComponent} tripId={selectedTripId} participants={selectedTripParticipants} />
    </div>
    <!-- PurchaseEntry component is now always rendered when a trip is selected, its internal button is hidden -->
    <PurchaseEntry 
        bind:this={purchaseEntryComponent} 
        tripId={selectedTripId} 
        participants={selectedTripParticipants} 
        on:purchaseAdded={handlePurchaseAdded}
        showTriggerButton={false} 
    />
    <div class="purchase-entry-container">
        <div class = "collapsible-header" on:click={() => isLogExpanded = !isLogExpanded}>
            <h3 class ="chart-header">Purchase Log</h3>
            <span class="arrow" class:expanded={isLogExpanded}>&#11206;</span> <!-- Down arrow -->
        </div>
        {#if isLogExpanded}
            <div class="collapsible-content">
            <PurchaseLog bind:this={purchaseLogComponent} tripId={selectedTripId} />
            </div>
        {/if}
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
      flex-direction: row; /* Stack label and select */
      align-items: center; /* Center items */
    }
  
    label {
      margin-bottom: 0.5em;
      font-weight: bold;
      color: #333;
      font-size: 1.2em;
    }
  
    select {
      padding: 0.5em;
      border: 1px solid #ccc;
      border-radius: 4px;
      min-width: 200px; /* Give it some minimum width */
      font-size: 1.2em;
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
     .collapsible-participants-container {
        font-family: sans-serif;
        border: 1px solid #ddd;
        border-radius: 5px;
        padding: 1.5em;
        margin: 1em auto;
        max-width: 400px;
        background-color: #f9f9f9;
    }

    .collapsible-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        margin-bottom: 0; /* Remove default margin from h3 */
        font-size: 1.2em;
    }

    .collapsible-header h3 {
        margin: 0; /* Remove default margin from h3 */
    }

    .arrow {
        transition: transform 0.2s ease-in-out;
    }

    .arrow.expanded {
        transform: rotate(180deg); /* Rotate arrow when expanded */
    }

    .collapsible-content {
        margin-top: 1em; /* Add space between header and content */
     }
     .events-select-container label {
        margin-right: 1em;
    }
    .events-select-container button {
        margin-left: 1em;
    }
    .status-chart-wrapper {
        margin: 1em auto; /* Center it and give some vertical space */
        padding: 1em;
        border: 1px solid #ddd;
        border-radius: 5px;
        max-width: 700px; /* Allow chart to be wider, adjust as needed */
        background-color: #f9f9f9; /* Optional: if you want a background */
    }
     .add-trip-button {
        padding: 0.5em 1em; /* Adjust padding to match select box or preference */
        font-size: 1em;     /* Match font size or adjust */
        border: none;
        border-radius: 4px;
        background-color: #515151; /* A nice blue, for example */
        color: white;
        cursor: pointer;
        transition: background-color 0.2s ease-in-out;
        font-weight: bold;
    }

    .add-trip-button:hover {
        background-color: #0056b3; /* Darker blue on hover */
    }
    .add-purchase-action-bar {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 1.5em auto;
        max-width: 40%; /* Match chart wrapper or adjust */
    }
    .global-add-purchase-button {
        padding: 0.8em 1.5em;
        font-size: 1.1em;
        border: none;
        border-radius: 5px;
        background-color: #28a745; /* Green, similar to modal save */
        color: white;
        cursor: pointer;
        transition: background-color 0.2s ease-in-out;
        font-weight: bold;
    }
    .global-add-purchase-button:hover {
        background-color: #218838; /* Darker green */
    }
    .global-add-purchase-button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
    .small-note { /* General small note style */
        font-size: 0.85em;
        color: #666;
        margin-top: 0.5em;
    }
  </style>