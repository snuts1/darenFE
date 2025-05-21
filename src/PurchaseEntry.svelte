<script>
  let showModal = false;
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  // Props passed from parent (Trips.svelte)
  export let tripId;
  export let participants = []; // Array of { id: number, name: string }
  export let showTriggerButton = true;
  let selectedDebtorIds = []; // Array to store IDs of selected debtors

  let purchaser = '';
  let description = '';
  let cost = null; // Use null for number inputs to allow placeholder/empty state
  let submitError = null; // State to hold submission errors

  function openModal() {
    showModal = true;
  }

  function closeModal() {
    showModal = false;
    // Reset form fields
    purchaser = '';
    description = '';
    cost = null;
    selectedDebtorIds = [];
  }

  async function handleSubmit() {
    // Basic validation
    if (!purchaser || !description.trim() || cost === null || cost <= 0) {
        alert('Please fill in all fields with valid values.');
        return;
    }

    const purchaseData = {
      trip_id: tripId,
      payer_participant_id: parseInt(purchaser, 10), // Convert string ID from select to integer
      total_amount: Math.round(cost * 100), // Convert dollars/euros to cents (integer)
      description: description.trim(),
      // Use current date/time for purchase_date
      purchase_date: new Date().toISOString(),
      debtor_ids: selectedDebtorIds, // Array of integer IDs
    };
    console.log('Purchase Entry:', purchaseData);
    try {
        const response = await fetch(`/api/v1/payback/purchases`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(purchaseData),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`HTTP error! status: ${response.status} - ${errorBody.error || errorBody.message}`);
        }

        // Assuming success, close modal and notify parent
        closeModal();
        dispatch('purchaseAdded'); // Notify parent component to re-fetch the log

    } catch (error) {
        console.error('Error creating purchase:', error);
        submitError = `Failed to save purchase: ${error.message}`;
    }
  }
  export { openModal };
</script>

<!-- Button to trigger the modal. You can place this wherever needed. -->
{#if showTriggerButton}<button on:click={openModal}>Add New Purchase</button>{/if}
{#if showModal}
  <div class="modal-backdrop" on:click={closeModal}>
    <div class="modal-content" on:click|stopPropagation>
      <h2>Add New Purchase</h2>
      {#if submitError}
        <p class="error-message">{submitError}</p>
      {/if}
      <form on:submit|preventDefault={handleSubmit}>
        <div>
          <label for="purchaser">Purchaser:</label>
          <select id="purchaser" bind:value={purchaser} required disabled={participants.length === 0}>
            <option value="" disabled selected>-- Select Purchaser --</option>
            {#each participants as participant (participant.id)}
              <option value={participant.id}>{participant.name}</option>
            {/each}
          </select>
          {#if participants.length === 0}<p class="small-note">No participants assigned to this trip.</p>{/if}
        </div>
        <div>
          <label for="description">Description:</label>
          <input type="text" id="description" bind:value={description} required />
        </div>
        <div>
          <label for="cost">Cost:</label>
          <input type="number" id="cost" bind:value={cost} min="0" step="0.01" placeholder="e.g., 10.50" required />
        </div>
        <div>
          
          <label>Recipient(s):</label>
          {#if participants.length > 0}
            <div class="debtors-list">
              {#each participants as participant (participant.id)}
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    value={participant.id}
                    bind:group={selectedDebtorIds}
                  />
                  {participant.name}
                </label>
              {/each}
            </div>
          {:else}
            <p class="small-note">No participants available to select as debtors. Add participants to the trip first.</p>
          {/if}
          <div class="info-note">
            <strong>Note:</strong> Cost is split evenly among selected recipients. For uneven splits, please enter separate purchases.
            If you (the purchaser) also benefited from this purchase, remember to include yourself in the recipient list.
          </div>
        </div>
        <div class="modal-actions">
          <button type="submit">Save Purchase</button>
          <button type="button" on:click={closeModal}>Cancel</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000; /* Ensure it's on top */
  }

  .modal-content {
    background-color: white;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    min-width: 350px;
    max-width: 500px;
    max-height: 90vh; overflow-y: auto;
  }

  .modal-content h2 {
    margin-top: 0;
    margin-bottom: 20px;
    font-size: 1.5em;
  }

  .modal-content div:not(.modal-actions) { /* Avoid applying to actions container */
    margin-bottom: 15px;
  }

  .modal-content label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
  }

  .modal-content input[type="text"],
  .modal-content input[type="number"] {
    width: 100%;
    padding: 10px;
    box-sizing: border-box;
    border: 1px solid #ccc;
    border-radius: 4px;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 25px;
  }

  .modal-actions button {
    padding: 10px 18px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
  }

  .modal-actions button[type="submit"] {
    background-color: #28a745; /* Green */
    color: white;
  }

  .modal-actions button[type="button"] {
    background-color: #6c757d; /* Gray */
    color: white;
  }
  .small-note {
      font-size: 0.8em;
      color: #666;
  }
  .debtors-list {
    display: flex;
    flex-direction: column; /* Stack checkboxes vertically */
    gap: 8px; /* Space between checkboxes */
    max-height: 150px; /* Optional: if you expect many participants */
    overflow-y: auto;  /* Add scroll if list is too long */
    border: 1px solid #eee;
    padding: 10px;
    border-radius: 4px;
    background-color: #fdfdfd;
  }

  .checkbox-label {
    display: flex; /* Align checkbox and text */
    align-items: center;
    font-weight: normal; /* Override general label bolding if needed */
    cursor: pointer;
  }
  .checkbox-label input[type="checkbox"] {
    width: auto; /* Let checkbox size naturally */
    margin-right: 8px; /* Space between checkbox and name */
  }
  .info-note {
    font-size: 0.85em;
    color: #555;
    background-color: #f0f0f0;
    padding: 8px 12px;
    border-radius: 4px;
    margin-top: 10px;
 }
</style>