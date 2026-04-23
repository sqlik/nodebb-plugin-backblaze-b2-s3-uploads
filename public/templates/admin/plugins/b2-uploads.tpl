<div class="acp-page-container">
	<div class="row">
		<div class="col-lg-9">
			<div class="acp-page-main-header align-items-center">
				<div>
					<h2 class="mb-0">[[b2-uploads:title]]</h2>
					<small class="text-muted">[[b2-uploads:subtitle]]</small>
				</div>
			</div>

			<form role="form" class="b2-uploads-settings">
				<div class="card mb-3">
					<div class="card-header">[[b2-uploads:section.connection]]</div>
					<div class="card-body">
						<div class="mb-3">
							<label class="form-label" for="endpoint">[[b2-uploads:field.endpoint]]</label>
							<input type="url" class="form-control" id="endpoint" name="endpoint" placeholder="https://s3.eu-central-003.backblazeb2.com" />
							<small class="form-text text-muted">[[b2-uploads:field.endpoint.help]]</small>
						</div>
						<div class="mb-3">
							<label class="form-label" for="region">[[b2-uploads:field.region]]</label>
							<input type="text" class="form-control" id="region" name="region" placeholder="eu-central-003" />
							<small class="form-text text-muted">[[b2-uploads:field.region.help]]</small>
						</div>
						<div class="mb-3">
							<label class="form-label" for="bucket">[[b2-uploads:field.bucket]]</label>
							<input type="text" class="form-control" id="bucket" name="bucket" />
						</div>
						<div class="mb-3">
							<label class="form-label" for="keyId">[[b2-uploads:field.keyId]]</label>
							<input type="text" class="form-control" id="keyId" name="keyId" autocomplete="off" />
						</div>
						<div class="mb-3">
							<label class="form-label" for="appKey">[[b2-uploads:field.appKey]]</label>
							<input type="password" class="form-control" id="appKey" name="appKey" autocomplete="off" />
							<small class="form-text text-muted">[[b2-uploads:field.appKey.help]]</small>
						</div>
					</div>
				</div>

				<div class="card mb-3">
					<div class="card-header">[[b2-uploads:section.behaviour]]</div>
					<div class="card-body">
						<div class="mb-3">
							<label class="form-label" for="pathPrefix">[[b2-uploads:field.pathPrefix]]</label>
							<input type="text" class="form-control" id="pathPrefix" name="pathPrefix" placeholder="uploads" />
						</div>
						<div class="mb-3">
							<label class="form-label" for="presignTtl">[[b2-uploads:field.presignTtl]]</label>
							<input type="number" class="form-control" id="presignTtl" name="presignTtl" min="60" max="604800" />
							<small class="form-text text-muted">[[b2-uploads:field.presignTtl.help]]</small>
						</div>
					</div>
				</div>

				<div class="card mb-3">
					<div class="card-header">[[b2-uploads:section.limits]]</div>
					<div class="card-body">
						<div class="alert alert-info">
							[[b2-uploads:limits.notice]]
						</div>
						<div class="mb-3">
							<label class="form-label" for="maxFileSize">[[b2-uploads:field.maxFileSize]]</label>
							<input type="number" class="form-control" id="maxFileSize" name="maxFileSize" min="1024" />
							<small class="form-text text-muted">[[b2-uploads:field.maxFileSize.help]]</small>
						</div>
						<div class="mb-3">
							<label class="form-label" for="maxVideoSize">[[b2-uploads:field.maxVideoSize]]</label>
							<input type="number" class="form-control" id="maxVideoSize" name="maxVideoSize" min="1024" />
							<small class="form-text text-muted">[[b2-uploads:field.maxVideoSize.help]]</small>
						</div>
						<div class="mb-3">
							<label class="form-label" for="allowedTypes">[[b2-uploads:field.allowedTypes]]</label>
							<input type="text" class="form-control" id="allowedTypes" name="allowedTypes" />
							<small class="form-text text-muted">[[b2-uploads:field.allowedTypes.help]]</small>
						</div>
					</div>
				</div>

				<div class="card mb-3">
					<div class="card-header">[[b2-uploads:section.maintenance]]</div>
					<div class="card-body">
						<div class="alert alert-info">
							[[b2-uploads:maintenance.notice]]
						</div>
						<div class="mb-3 form-check form-switch">
							<input type="checkbox" class="form-check-input" id="cleanupEnabled" name="cleanupEnabled" />
							<label class="form-check-label" for="cleanupEnabled">[[b2-uploads:field.cleanupEnabled]]</label>
						</div>
						<div class="mb-3">
							<label class="form-label" for="cleanupAgeHours">[[b2-uploads:field.cleanupAgeHours]]</label>
							<input type="number" class="form-control" id="cleanupAgeHours" name="cleanupAgeHours" min="1" />
							<small class="form-text text-muted">[[b2-uploads:field.cleanupAgeHours.help]]</small>
						</div>
						<div class="mb-3">
							<label class="form-label" for="cleanupIntervalHours">[[b2-uploads:field.cleanupIntervalHours]]</label>
							<input type="number" class="form-control" id="cleanupIntervalHours" name="cleanupIntervalHours" min="1" />
							<small class="form-text text-muted">[[b2-uploads:field.cleanupIntervalHours.help]]</small>
						</div>
						<button type="button" id="sweep-now" class="btn btn-outline-secondary btn-sm">[[b2-uploads:maintenance.runNow]]</button>
					</div>
				</div>

				<div class="card mb-3">
					<div class="card-header">[[b2-uploads:section.bunny]]</div>
					<div class="card-body">
						<div class="alert alert-info">
							[[b2-uploads:bunny.notice]]
						</div>
						<div class="mb-3 form-check form-switch">
							<input type="checkbox" class="form-check-input" id="useBunny" name="useBunny" />
							<label class="form-check-label" for="useBunny">[[b2-uploads:field.useBunny]]</label>
						</div>
						<div class="mb-3">
							<label class="form-label" for="bunnyHostname">[[b2-uploads:field.bunnyHostname]]</label>
							<input type="text" class="form-control" id="bunnyHostname" name="bunnyHostname" placeholder="omdm-uploads.b-cdn.net" />
							<small class="form-text text-muted">[[b2-uploads:field.bunnyHostname.help]]</small>
						</div>
						<div class="mb-3">
							<label class="form-label" for="bunnyTokenKey">[[b2-uploads:field.bunnyTokenKey]]</label>
							<input type="password" class="form-control" id="bunnyTokenKey" name="bunnyTokenKey" autocomplete="off" />
							<small class="form-text text-muted">[[b2-uploads:field.bunnyTokenKey.help]]</small>
						</div>
						<div class="mb-3">
							<label class="form-label" for="bunnyTokenTtl">[[b2-uploads:field.bunnyTokenTtl]]</label>
							<input type="number" class="form-control" id="bunnyTokenTtl" name="bunnyTokenTtl" min="0" max="604800" />
							<small class="form-text text-muted">[[b2-uploads:field.bunnyTokenTtl.help]]</small>
						</div>
					</div>
				</div>
			</form>
		</div>

		<div class="col-lg-3 acp-sidebar">
			<div class="card">
				<div class="card-body">
					<button id="save" class="btn btn-primary w-100">[[b2-uploads:save]]</button>
					<hr>
					<p class="small text-muted mb-2">[[b2-uploads:status.label]]</p>
					<p class="small mb-1">
						{{{ if configured }}}
						<span class="badge bg-success">[[b2-uploads:status.configured]]</span>
						{{{ else }}}
						<span class="badge bg-warning">[[b2-uploads:status.not-configured]]</span>
						{{{ end }}}
					</p>
					<p class="small">
						{{{ if bunnyActive }}}
						<span class="badge bg-info">[[b2-uploads:status.bunny-on]]</span>
						{{{ else }}}
						<span class="badge bg-secondary">[[b2-uploads:status.bunny-off]]</span>
						{{{ end }}}
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
