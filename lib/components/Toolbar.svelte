<script lang="ts">
	let searchActive = false;
	let thinkActive = false;

	function toggleSearch() {
		searchActive = !searchActive;
	}

	function toggleThink() {
		thinkActive = !thinkActive;
	}
</script>

<div class="toolbar-container">
	<div class="toolbar-main">
		<textarea placeholder="How can I help you today?"></textarea>
		<div class="actions">
			<button class="attach-button" aria-label="Attach">
				<span class="material-icons">attach_file</span>
			</button>
			<button class="submit-button" aria-label="Submit">
				<span class="submit-icon-wrapper">
					<span class="material-icons">arrow_upward</span>
				</span>
			</button>
		</div>
	</div>
	<div class="toolbar-extra">
		<select class="model-select">
			<option value="model-a">Model A</option>
			<option value="model-b">Model B</option>
			<option value="model-c">Model C</option>
		</select>
		<button class="toggle-button search-toggle" aria-label="Search" on:click={toggleSearch} class:active={searchActive}>
			<span class="material-icons">search</span>
			<span>Search</span>
		</button>
		<button class="toggle-button think-toggle" aria-label="Think" on:click={toggleThink} class:active={thinkActive}>
			<span class="material-icons">lightbulb</span>
			<span>Think</span>
		</button>
	</div>
</div>

<style>
	@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

	.toolbar-container {
		background-color: white;
		border: 1px solid #DBDDDC;
		border-radius: 8px;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.toolbar-main {
		display: flex;
		align-items: center;
	}

	.toolbar-main textarea {
		flex: 1;
		border: none;
		outline: none;
		resize: none;
		font-size: 16px;
		padding: 8px;
		background: transparent;
	}

	.actions {
		display: flex;
		align-items: center;
		margin-left: 8px;
	}

	.actions button {
		border: none;
		background: none;
		padding: 8px;
		cursor: pointer;
	}

	.attach-button .material-icons {
		font-size: 24px;
		color: #555;
	}

	.submit-button {
		background: none;
	}

	.submit-icon-wrapper {
		background-color: #235BA8;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px;
	}

	.submit-icon-wrapper .material-icons {
		font-size: 24px;
		color: white;
	}

	.toolbar-extra {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.model-select {
		flex: 1;
		padding: 8px;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 16px;
		background-color: white;
	}

	.toggle-button {
		display: flex;
		align-items: center;
		gap: 4px;
		background-color: white;
		color: black;
		border: 1px solid black;
		border-radius: 4px;
		padding: 8px 12px;
		cursor: pointer;
		font-size: 16px;
	}

	.toggle-button .material-icons {
		font-size: 20px;
	}

	/* Active state for toggle buttons */
	.toggle-button.active {
		background-color: #235BA8;
		color: white;
	}

	.toggle-button.active .material-icons {
		color: white;
	}
</style>
