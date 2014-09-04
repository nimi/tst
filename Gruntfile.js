'use strict';

module.exports = function(grunt) {

	var localConfig;

	try {
		localConfig = require('./server/config/local.env');
	} catch(e) {
		localConfig = {};
	}

	require('jit-grunt')(grunt, {
		express: 'grunt-express-server',
		useminPrepare: 'grunt-usemin',
		ngtemplates: 'grunt-angular-templates',
		cdnify: 'grunt-google-cdn',
		protractor: 'grunt-protractor-runner',
		injector: 'grunt-asset-injector',
		buildControl: 'grunt-build-control'
	});

	// Grunt time describes how long tasks will take on build
	require('time-grunt')(grunt);

	// Define task configuration
	grunt.initConfig({

		// Project Settings
		pkg: grunt.file.readJSON('package.json'),

		app: {
			client: require('./bower.json').appPath || 'client',
			dist: 'dist'
		},
		express: {
			options: {
				port: process.env.PORT || 9000
			},
			dev: {
				options: {
					script: 'server/app.js',
					debug: true
				}
			},
			prod: {
				options: {
					script: 'dist/server/app.js'
				}
			}
		},
		open: {
			server: {
				url: 'http://localhost:<%= express.options.port %>'
			}
		},
		watch: {
			injectJS: {
				files: [
					'<%= app.client %>/{app,components}/**/*.js',
					'<%= app.client %>/{app,components}/**/*.spec.js',
					'<%= app.client %>/{app,components}/**/*.mock.js',
					'<%= app.client %>/app/app.js'],
				tasks: ['injector:scripts']
			},
			injectCss: {
				files: [ '<%= app.client %>/{app,components}/**/*.css' ],
				tasks: [ 'injector.css' ]
			},
			mochaTest: {
				files: ['server/**/*.spec.js'],
				tasks: ['env:test', 'mochaTest']
			},
			jsTest: {
	        	files: [
	          		'<%= app.client %>/{app,components}/**/*.spec.js',
	          		'<%= app.client %>/{app,components}/**/*.mock.js' ],
        		tasks: ['newer:jshint:all', 'karma']
      		},
      		injectSass: {
        		files: [ '<%= app.client %>/{app,components}/**/*.{scss,sass}' ],
        		tasks: ['injector:sass']
      		},
      		sass: {
        		files: [
          			'<%= app.client %>/{app,components}/**/*.{scss,sass}'],
        		tasks: ['sass', 'autoprefixer']
      		},
      		gruntfile: {
        		files: ['Gruntfile.js']
      		},
      		livereload: {
	        	files: [
					'{.tmp,<%= app.client %>}/{app,components}/**/*.css',
					'{.tmp,<%= app.client %>}/{app,components}/**/*.html',
					'{.tmp,<%= app.client %>}/{app,components}/**/*.js',
					'!{.tmp,<%= app.client %>}{app,components}/**/*.spec.js',
					'!{.tmp,<%= app.client %>}/{app,components}/**/*.mock.js',
					'<%= app.client %>/assets/images/{,*//*}*.{png,jpg,jpeg,gif,webp,svg}'
	        	],
	        	options: {
	          		livereload: true
	        	}
      		},
      		express: {
        		files: [
          			'server/**/*.{js,json}'
        		],
        		tasks: ['express:dev', 'wait'],
        		options: {
          			livereload: true,
          			nospawn: true //Without this option specified express won't be reloaded
        		}
      		}
		},

		// Keep code up to jshint standards
		jshint: {
			options: {
				jshintrc: '<%= app.client %>/.jshintrc',
				reporter: require('jshint-stylish')
			}
			server: {
				options: {
					jshintrc: 'server/.jshintrc'
				}
				src: [
					'server/**/*.js',
					'!server/**/*.spec.js'
				]
			},
			server: {
				options: {
					jshintrc: 'server/.jshintrc-spec'
				}
				src: [ 'server/**/*.spec.js' ]
			},
			all: [
		        '<%= app.client %>/{app,components}/**/*.js',
		        '!<%= app.client %>/{app,components}/**/*.spec.js',
		        '!<%= app.client %>/{app,components}/**/*.mock.js'
		    ],
		    test: {
		        src: [
		        	'<%= app.client %>/{app,components}/**/*.spec.js',
		        	'<%= app.client %>/{app,components}/**/*.mock.js'
		        ]
		    }
		},
		// Empties folders
		clean: {
			dist: {
				files: [{
					dot: true,
					src: [
						'.tmp',
						'<%= app.dist %>/*',
						'!<%= app.dist %>/.git*',
						'!<%= app.dist %>/.openshift',
						'!<%= app.dist %>/Procfile'
					]
				}]
			},
			server: '.tmp'
		}

		// Add vendor prefixed styles
		autoprefixer: {
			options: {

			},
			dist: {
				files: [{
					expand: true,
					cwd: '.tmp/'
				src: '{,*/}*.css',
				dest: '.tmp/'
				}]
			}
		},

		// Node debugging
		'node-inspector': {
			custom: {
				options: {
					'web-host': 'localhost'
				}
			}
		},

		// Node monitor; use nodemon to run server in debug mode with an initial breakpoint
		nodemon: {
			debug: {
				script: 'server/app.js',
				options: {
					nodeArgs: [ '--debug-brk' ],
					env: { PORT: process.env.PORT || 9000 }
				},
				callback: function(nodemon) {
					nodemon.on('log', function(event) {
						console.log(event.colour);
					});

					// Opens browser on intial server start
					nodemon.on('config:update', function() {
						setTimeout(function () {
							require('open')('http://localhost:8080/debug?port=5858');
						}, 500);
					});
				}
			}
		},

		// Auto inject bower components
		wiredep: {
			target: {
				src: '<%= app.client =>/index.html',
				ignorePath: '<%= app.client &>',
				exclude: [/, /bootstrap.js, '/json3/', '/es5-shim', /bootstrap.css/, /font-awesome.css/ ]
			}
		},

		// Renames files for browser caching purposes. Used with usemin
		rev: {
			dist: {
				files: {
				src: [
					'<%= app.dist %>/public/{,*/}*.js',
					'<%= app.dist %>/public/{,*/}*.css',
					'<%= app.dist %>/public/assets/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}',
					'<%= app.dist %>/public/assets/fonts/*'
				]
			}
		},

		// Reads HTML for usemin blocks to enable smart builds that automatically
		// concat, minify and revision files. Creates configurations in memory so
		// additional tasks can operate on them
		useminPrepare: {
			html: [ '<%= app.client %>/index.html' ],
			options: {
				dest: '<%= app.dist %>/public'
			}
		},

		// Performs rewrites based on rev and the useminPrepare configuration
		usemin: {
			html: [ '<%= app.dist %>/public/{,*/}*.html' ],
			css: [ '<%= app.dist %>/public/{,*/}*.css' ],
			js: [ '<%= app.dist %>/public/{,*/}*.js' ],
			options: {
			assetsDirs: [
				'<%= app.dist %>/public',
				'<%= app.dist %>/public/assets/images'
			],
			// This is so we update image references in our ng-templates
			patterns: {
				js: [
					[/(assets\/images\/.*?\.(?:gif|jpeg|jpg|png|webp|svg))/gm, 'Update the JS to reference our revved images']
				]
			}
		},

		// Minification tasks for images and SVG
		imagemin: {
			dist: {
				files: [{
					expand: true,
					cwd: '<%= app.dist %>/assets/images',
					src: '{,*/}*.{png,jpg,jpeg,gif}',
					dest: '<%= app.dist =>/public/assets/images'
				}]
			}
		},
		svgmin: {
			dist: {
				files: [{
					expand: true,
					cwd: '<%= app.dist %>/assets/images',
					src: '{,*/}*.svg',
					dest: '<%= app.dist =>/public/assets/images'
				}]
			}
		},

		// Minify certain AngularJS files without uglify destroying ng references
		ngAnnotate: {
			dist: {
				files: [{
					expand: true,
					cwd: './tmp/concat',
					src: '*/**.js',
					dest: '.tmp/concat'
				}]
			}
		},

		// Copies remaining files to places other tasks can use
		copy: {
			dist: {
				files: [{
					expand: true,
					dot: true,
					cwd: '<%= app.client %>',
					dest: '<%= app.dist %>/public',
					src: [
						'*.{ico,png,txt}',
						'.htaccess',
						'bower_components/**/*',
						'assets/images/{,*/}*.{webp}',
						'assets/fonts/**/*',
						'index.html'
					]
					}, {
					expand: true,
						cwd: '.tmp/images',
						dest: '<%= app.dist %>/public/assets/images',
						src: [ 'generated/*' ]
					}, {
					expand: true,
					dest: '<%= app.dist %>',
					src: [
						'package.json',
						'server/**/*'
					]
				}]
			},
			styles: {
				expand: true,
				cwd: '<%= app.client %>',
				dest: '.tmp/',
				src: [ '{app,components}/**/*.css' ]
			}
		},

		buildcontrol: {
			options: {
				dir: 'dist',
				commit: true,
				push: true,
				connectCommits: false,
				message: 'Built %sourceName% from commit %sourceCommit% on branch %sourceBranch%'
			},
			heroku: {
				options: {
					remote: 'heroku',
					branch: 'master'
				}
			},
			openshift: {
				options: {
					remote: 'openshift',
					branch: 'master'
				}
			}
		},

		// Run some tasks in parallel to speed up the build process
		concurrent: {
			server: [
				'sass',
			],
			test: [
				'sass',
			],
			debug: {
				tasks: [
					'nodemon',
					'node-inspector'
				],
				options: {
					logConcurrentOutput: true
				}
			},
			dist: [
				'sass',
				'imagemin',
				'svgmin'
			]
		},

		// Test settings
		karma: {
			unit: {
				configFile: 'karma.conf.js',
				singleRun: true
			}
		},

		mochaTest: {
			options: {
				reporter: 'spec'
			},
			src: ['server/**/*.spec.js']
		},

		protractor: {
			options: {
				configFile: 'protractor.conf.js'
			},
			chrome: {
				options: {
					args: {
						browser: 'chrome'
					}
				}
			}
		},

		env: {
			test: {
				NODE_ENV: 'test'
			},
			prod: {
				NODE_ENV: 'production'
			},
				all: localConfig
			},

		// Compiles Sass to CSS
		sass: {
			server: {
				options: {
					loadPath: [
						'<%= app.client %>/bower_components',
						'<%= app.client %>/app',
						'<%= app.client %>/components'
					],
					compass: false
				},
				files: {
					'.tmp/app/app.css' : '<%= app.client %>/app/app.scss'
				}
			}
		},

		injector: {
			options: {},

			// Inject application script files into index.html (doesn't include bower)
			scripts: {
				options: {
					transform: function(filePath) {
						filePath = filePath.replace('/client/', '');
						filePath = filePath.replace('/.tmp/', '');
						return '<script src="' + filePath + '"></script>';
					},
					starttag: '<!-- injector:js -->',
					endtag: '<!-- endinjector -->'
				},
				files: {
					'<%= app.client %>/index.html': [
						['{.tmp,<%= app.client %>}/{app,components}/**/*.js',
						'!{.tmp,<%= app.client %>}/app/app.js',
						'!{.tmp,<%= app.client %>}/{app,components}/**/*.spec.js',
						'!{.tmp,<%= app.client %>}/{app,components}/**/*.mock.js']
					]
				}
			},

			// Inject component scss into app.scss
			sass: {
				options: {
					transform: function(filePath) {
						filePath = filePath.replace('/client/app/', '');
						filePath = filePath.replace('/client/components/', '');
						return '@import \'' + filePath + '\';';
					},
					starttag: '// injector',
					endtag: '// endinjector'
				},
				files: {
					'<%= app.client %>/app/app.scss': [
						'<%= app.client %>/{app,components}/**/*.{scss,sass}',
						'!<%= app.client %>/app/app.{scss,sass}'
					]
				}
			},

			// Inject component css into index.html
			css: {
				options: {
					transform: function(filePath) {
						filePath = filePath.replace('/client/', '');
						filePath = filePath.replace('/.tmp/', '');
						return '<link rel="stylesheet" href="' + filePath + '">';
					},
					starttag: '<!-- injector:css -->',
					endtag: '<!-- endinjector -->'
				},
				files: {
					'<%= app.client %>/index.html': [
						'<%= app.client %>/{app,components}/**/*.css'
					]
				}
			}
		}
	});

	// Used for delaying livereload until after server has restarted
	grunt.registerTask('wait', function () {
		grunt.log.ok('Waiting for server reload...');

		var done = this.async();

		setTimeout(function () {
			grunt.log.writeln('Done waiting!');
				done();
			}, 1500);
		});

	grunt.registerTask('express-keepalive', 'Keep grunt running', function() {
		this.async();
	});

	grunt.registerTask('serve', function (target) {
		if (target === 'dist') {
			return grunt.task.run(['build', 'env:all', 'env:prod', 'express:prod', 'wait', 'open', 'express-keepalive']);
		}

		if (target === 'debug') {
			return grunt.task.run([
				'clean:server',
				'env:all',
				'injector:sass', 
				'concurrent:server',
				'injector',
				'wiredep',
				'autoprefixer',
				'concurrent:debug'
			]);
		}

		grunt.task.run([
				'clean:server',
				'env:all',
				'injector:sass', 
				'concurrent:server',
				'injector',
				'wiredep',
				'autoprefixer',
				'express:dev',
				'wait',
				'open',
				'watch'
			]);
		});

		grunt.registerTask('server', function () {
			grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
			grunt.task.run(['serve']);
		});

		grunt.registerTask('test', function(target) {
			if (target === 'server') {
				return grunt.task.run([
					'env:all',
					'env:test',
					'mochaTest'
				]);
			}

			else if (target === 'client') {
				return grunt.task.run([
					'clean:server',
					'env:all',
					'injector:sass', 
					'concurrent:test',
					'injector',
					'autoprefixer',
					'karma'
				]);
			}

			else if (target === 'e2e') {
				return grunt.task.run([
					'clean:server',
					'env:all',
					'env:test',
					'injector:sass', 
					'concurrent:test',
					'injector',
					'wiredep',
					'autoprefixer',
					'express:dev',
					'protractor'
				]);
			}

			else grunt.task.run([
				'test:server',
				'test:client'
			]);
		});

		grunt.registerTask('build', [
			'clean:dist',
			'injector:sass', 
			'concurrent:dist',
			'injector',
			'wiredep',
			'useminPrepare',
			'autoprefixer',
			'ngtemplates',
			'concat',
			'ngAnnotate',
			'copy:dist',
			'cdnify',
			'cssmin',
			'uglify',
			'rev',
			'usemin'
		]);

	grunt.registerTask('default', [
			'newer:jshint',
			'test',
			'build'
		]);
	};
};