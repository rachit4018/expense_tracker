from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import CustomUser,Group
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import authenticate, get_user_model
class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password1', 'password2', 'college', 'semester', 'default_payment_methods']

User = get_user_model()
class CustomAuthenticationForm(forms.Form):
    email = forms.EmailField(label="Email", max_length=254)
    password = forms.CharField(label="Password", widget=forms.PasswordInput)
    user = None

    def clean(self):
        email = self.cleaned_data.get("email")
        password = self.cleaned_data.get("password")

        if email and password:
            try:
                user_obj = User.objects.get(email=email)
            except User.DoesNotExist:
                raise forms.ValidationError(_("Invalid email or password"))

            user = authenticate(username=user_obj.username, password=password)

            if user is None:
                raise forms.ValidationError(_("Invalid email or password"))

            self.user = user
        else:
            raise forms.ValidationError(_("Email and password are required"))

        return self.cleaned_data

    def get_user(self):
        return self.user

class GroupForm(forms.ModelForm):
    class Meta:
        model = Group
        fields = ['name','created_by']
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Enter group name'}),
        }