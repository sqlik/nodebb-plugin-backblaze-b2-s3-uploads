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
			</form>
		</div>

		<div class="col-lg-3 acp-sidebar">
			<div class="card">
				<div class="card-body">
					<button id="save" class="btn btn-primary w-100">[[b2-uploads:save]]</button>
					<hr>
					<p class="small text-muted mb-2">[[b2-uploads:status.label]]</p>
					<p class="small">
						{{{ if configured }}}
						<span class="badge bg-success">[[b2-uploads:status.configured]]</span>
						{{{ else }}}
						<span class="badge bg-warning">[[b2-uploads:status.not-configured]]</span>
						{{{ end }}}
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
