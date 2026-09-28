import org.jetbrains.kotlin.gradle.dsl.JvmTarget

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// The address the shell opens is injected at build time, never committed: CI
// passes -Prsspod.baseUrl from the RSS_POD_WEB_URL repository variable, and the
// placeholder below only serves a local build.
val placeholderBaseUrl = "https://pod.example.com"

val baseUrl: String = (findProperty("rsspod.baseUrl") as String?)
    ?.trim()
    ?.takeIf { it.startsWith("https://") || it.startsWith("http://") }
    ?: placeholderBaseUrl

// Set only by CI, and only when the signing secrets are present.
val storeFilePath: String? = (findProperty("rsspod.storeFile") as String?)?.takeIf { it.isNotBlank() }

android {
    namespace = "com.rsspod.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.rsspod.app"
        minSdk = 26
        targetSdk = 35
        versionCode = (findProperty("rsspod.versionCode") as String?)?.toIntOrNull() ?: 1
        versionName = (findProperty("rsspod.versionName") as String?)?.takeIf { it.isNotBlank() } ?: "dev"

        buildConfigField("String", "BASE_URL", "\"$baseUrl\"")
        // Cleartext is only allowed for a deployment that answers on http; an
        // https deployment keeps the platform default.
        manifestPlaceholders["usesCleartextTraffic"] = baseUrl.startsWith("http://").toString()
    }

    buildFeatures {
        buildConfig = true
    }

    signingConfigs {
        if (storeFilePath != null) {
            create("release") {
                storeFile = file(storeFilePath)
                storePassword = findProperty("rsspod.storePassword") as String?
                keyAlias = findProperty("rsspod.keyAlias") as String?
                keyPassword = findProperty("rsspod.keyPassword") as String?
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            isShrinkResources = false
            // A build without the signing secrets still has to produce an
            // installable package, so it falls back to the debug key.
            signingConfig = signingConfigs.findByName("release") ?: signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}

kotlin {
    compilerOptions {
        jvmTarget.set(JvmTarget.JVM_17)
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.media:media:1.7.0")
}
