<script>
    import { onMount, createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    // Prop: The ID of the trip we are assigning participants to
    export let tripId;
    export let tripName = "Selected Trip";

    // State for ALL participants (source list)
    let allParticipants = [];
    let isLoadingAllParticipants = true;
    let allParticipantsError = null;

    // State for participants assigned to the current trip
    let assignedParticipants = [];
    let isLoadingAssignedParticipants = false;
    let assignedParticipantsError = null;

     // State for adding a new participant
    let newParticipantName = '';
    let isAddingParticipant = false;
    let addParticipantError = null;

    // Fetch all participants when the component mounts
    onMount(async () => {
        try {
            const response = await fetch(`/api/v1/payback/participants`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allParticipants = await response.json();
        } catch (e) {
            console.error("Failed to fetch all participants:", e);
            allParticipantsError = e.message;
            allParticipants = [];
        } finally {
            isLoadingAllParticipants = false;
        }
    });

    // Reactive statement to fetch assigned participants when tripId changes
    $: if (tripId) {
        fetchAssignedParticipantsForTrip(tripId);
    } else {
        assignedParticipants = []; // Clear assigned participants if no tripId
        assignedParticipantsError = null;
        isLoadingAssignedParticipants = false;
    }

    async function fetchAssignedParticipantsForTrip(currentTripId) {
        if (!currentTripId) return;

        isLoadingAssignedParticipants = true;
        assignedParticipantsError = null;
        assignedParticipants = []; // Clear previous assigned participants

        try {
            const response = await fetch(`/api/v1/payback/trips/${currentTripId}/participants`);
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response' }));
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorData.detail}`);
            }
            assignedParticipants = await response.json();
            if (!Array.isArray(assignedParticipants)) {
                console.warn("Assigned participants data is not an array:", assignedParticipants);
                assignedParticipants = []; // Ensure it's an array
            }
        } catch (e) {
            console.error(`Failed to fetch assigned participants for trip ${currentTripId}:`, e);
            assignedParticipantsError = e.message;
        } finally {
            isLoadingAssignedParticipants = false;
        }
    }

    // Helper to check if a participant is assigned to the current trip
    function isParticipantAssigned(participantId) {
        const isAssigned = assignedParticipants.some(p => p.id === participantId);
        return isAssigned;
    }
    async function handleAddNewParticipant() {
        if (!newParticipantName.trim()) {
            addParticipantError = "Participant name cannot be empty.";
            return;
        }
        if (!tripId) {
            addParticipantError = "No trip selected to add participant to.";
            return;
        }

        isAddingParticipant = true;
        addParticipantError = null;
        let createdParticipantId = null;

        try {
            // Step 1: Create the new participant
            const createResponse = await fetch(`/api/v1/payback/participants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newParticipantName.trim() }),
            });
            if (!createResponse.ok) {
                const errorData = await createResponse.json().catch(() => ({ detail: 'Failed to parse create error' }));
                throw new Error(`Create failed: ${createResponse.status} - ${errorData.error || errorData.detail}`);
            }
            const createdParticipant = await createResponse.json();
            createdParticipantId = createdParticipant.id;

            if (!createdParticipantId) {
                throw new Error("Failed to get ID of newly created participant.");
            }

            // Step 2: Assign the new participant to the current trip
            const assignResponse = await fetch(`/api/v1/payback/trips/${tripId}/participants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ participant_id: createdParticipantId }),
            });
            if (!assignResponse.ok) {
                const errorData = await assignResponse.json().catch(() => ({ detail: 'Failed to parse assign error' }));
                throw new Error(`Assign failed: ${assignResponse.status} - ${errorData.error || errorData.detail}`);
            }

            // Success! Clear name, refresh lists
            newParticipantName = '';
            await fetchAllParticipants(); // Re-fetch all participants to include the new one
            await fetchAssignedParticipantsForTrip(tripId); // Re-fetch assigned to update checkboxes
            dispatch('participantAdded');
        } catch (e) {
            console.error("Failed to add and assign new participant:", e);
            addParticipantError = e.message;
        } finally {
            isAddingParticipant = false;
        }
    }

    async function toggleParticipantAssignment(participantId, isCurrentlyAssigned) {
        if (!tripId) return; // Should not happen if UI is disabled, but good check

        const originalAssignedParticipants = [...assignedParticipants]; // For optimistic update rollback

        if (isCurrentlyAssigned) { // User wants to remove
            // Optimistic update
            assignedParticipants = assignedParticipants.filter(p => p.id !== participantId);
            try {
                const response = await fetch(`/api/v1/payback/trips/${tripId}/participants/${participantId}`, {
                    method: 'DELETE',
                });
                if (!response.ok) {
                    assignedParticipants = originalAssignedParticipants; // Rollback
                     const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response' }));
                    throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorData.detail}`);
                }
                // Optionally re-fetch or trust optimistic update: fetchAssignedParticipantsForTrip(tripId);
            } catch (e) {
                console.error(`Failed to remove participant ${participantId} from trip ${tripId}:`, e);
                assignedParticipantsError = `Failed to remove participant: ${e.message}`;
                assignedParticipants = originalAssignedParticipants; // Rollback
            }
        } else { // User wants to add
            // Optimistic update (find the participant from allParticipants to add)
            const participantToAdd = allParticipants.find(p => p.id === participantId);
            if (participantToAdd) assignedParticipants = [...assignedParticipants, participantToAdd];

            try {
                const response = await fetch(`/api/v1/payback/trips/${tripId}/participants`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ participant_id: participantId }),
                });
                if (!response.ok) {
                    assignedParticipants = originalAssignedParticipants; // Rollback
                     const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response' }));
                    throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorData.detail}`);
                }
                // Optionally re-fetch or trust optimistic update: fetchAssignedParticipantsForTrip(tripId);
            } catch (e) {
                console.error(`Failed to add participant ${participantId} to trip ${tripId}:`, e);
                assignedParticipantsError = `Failed to add participant: ${e.message}`;
                assignedParticipants = originalAssignedParticipants; // Rollback
            } finally {
            isLoadingAssignedParticipants = false;
            }
         }
        }
        // Helper function to re-fetch all participants (used after adding a new one)
    async function fetchAllParticipants() {
        // Re-using the onMount logic, could be refactored further if desired
        // For simplicity, just copy-pasting the fetch logic for now
        isLoadingAllParticipants = true; // Show loading for the list update
        try {
            const response = await fetch(`/api/v1/payback/participants`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            allParticipants = await response.json() || [];
        } catch (e) {
            console.error("Failed to re-fetch all participants:", e);
            allParticipantsError = e.message; // Could display this error too
        } finally {
            isLoadingAllParticipants = false;
        }
    }
</script>

{#if isLoadingAllParticipants}
    <p>Loading all participants...</p>
{:else if allParticipantsError}
    <p class="error-message">Could not load all participants: {allParticipantsError}</p>
{:else if allParticipants.length > 0}
    <div class="assign-participants-container">
        <h2>{tripName ? `${tripName} Participants` : `x`}</h2>
        {#if isLoadingAssignedParticipants}
            <p>Updating assignment...</p>
        {:else if assignedParticipantsError}
            <p class="error-message">Assignment failed: {assignedParticipantsError}</p>
        {/if}
        <div class="add-participant-form">
            <input 
                type="text" 
                bind:value={newParticipantName} 
                placeholder="New participant name"
                disabled={isAddingParticipant}
            />
            <button on:click={handleAddNewParticipant} disabled={isAddingParticipant || !newParticipantName.trim()}>
                {isAddingParticipant ? 'Adding...' : 'Add'}
            </button>
            {#if addParticipantError}
                <p class="error-message small-error">{addParticipantError}</p>
            {/if}
        </div>
        <ul class="participant-checkbox-list">
            {#each allParticipants as participant (participant.id)}
                <li>
                    <label>
                        <input
                            type="checkbox"
                            checked={isParticipantAssigned(participant.id)}
                            on:change={() => toggleParticipantAssignment(participant.id, isParticipantAssigned(participant.id))}
                            disabled={!tripId || isLoadingAssignedParticipants}
                        />
                        {participant.name} (ID: {participant.id})
                    </label>
                </li>
            {/each}
        </ul>
    </div>
{:else}
    <p>No participants available to assign. Create participants first.</p>
{/if}

<style>
    .assign-participants-container {
        margin-top: 2em;
        padding: 1em;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    .participant-checkbox-list {
        list-style-type: none;
        padding: 0;
    }

    .participant-checkbox-list li {
        margin-bottom: 0.5em;
    }
    .participant-checkbox-list label {
        cursor: pointer;
    }

    .error-message {
        color: red;
        font-style: italic;
    }
    .add-participant-form {
        display: flex;
        gap: 10px;
        align-items: center;
        margin-bottom: 1.5em; /* Space before the checkbox list */
        flex-wrap: wrap; /* Allow wrapping if space is tight */
    }
    .add-participant-form input[type="text"] {
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        flex-grow: 1; /* Allow input to take available space */
    }
</style>