<script>
    import { createEventDispatcher } from 'svelte';
    const dispatch = createEventDispatcher();

    let tripName = '';
    let isLoading = false;
    let error = null;

    async function handleAddTrip() {
        if (!tripName.trim()) {
            error = "Trip name cannot be empty.";
            return;
        }

        isLoading = true;
        error = null;

        try {
            const response = await fetch('/api/v1/payback/trips', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: tripName.trim() }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response' }));
                throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || errorData.detail}`);
            }

            // const newTrip = await response.json(); // You might want the new trip data
            dispatch('tripAdded'); // Notify parent that a trip was added
            tripName = ''; // Clear the input
        } catch (e) {
            console.error("Failed to add trip:", e);
            error = e.message;
        } finally {
            isLoading = false;
        }
    }

    function closeModal() {
        dispatch('close'); // Notify parent to close the modal
    }
</script>

<div class="add-trip-modal-content">
    <h2>Add New Trip</h2>
    <div class="form-group">
        <label for="trip-name-input">Trip Name:</label>
        <input 
            id="trip-name-input"
            type="text" 
            bind:value={tripName} 
            placeholder="e.g., Summer Vacation 2024"
            disabled={isLoading}
        />
    </div>
    {#if error}
        <p class="error-message">{error}</p>
    {/if}
    <div class="actions">
        <button on:click={handleAddTrip} disabled={isLoading || !tripName.trim()}>
            {isLoading ? 'Adding...' : 'Add Trip'}
        </button>
        <button class="cancel-button" on:click={closeModal} disabled={isLoading}>Cancel</button>
    </div>
</div>

<style>
    .add-trip-modal-content {
        /* Styles for the content within the modal, if not handled by a generic modal component */
        padding: 20px;
    }
    .form-group {
        margin-bottom: 15px;
    }
    .form-group label {
        display: block;
        margin-bottom: 5px;
    }
    .form-group input {
        width: 100%;
        padding: 8px;
        box-sizing: border-box;
    }
    .actions {
        margin-top: 20px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    }
    .error-message {
        color: red;
        font-size: 0.9em;
        margin-top: 10px;
    }
    .cancel-button {
        background-color: #ccc;
        color: #333;
    }
</style>