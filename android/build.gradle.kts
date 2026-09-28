// The shell exists only to host the deployed web player, so the plugin set is
// kept to the two that are needed to build an app module.
plugins {
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.1.0" apply false
}
