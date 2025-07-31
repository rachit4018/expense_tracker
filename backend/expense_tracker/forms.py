from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import CustomUser,Group

class CustomUserCreationForm(UserCreationForm):
    class Meta:
        model = CustomUser
        fields = ['username', 'email', 'password1', 'password2', 'college', 'semester', 'default_payment_methods']

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if CustomUser.objects.filter(email=email).exists():
            raise forms.ValidationError("Email is already registered.")
        return email
        

class CustomAuthenticationForm(AuthenticationForm):
    class Meta:
        model = CustomUser
        fields = ['username', 'password']

class GroupForm(forms.ModelForm):
    class Meta:
        model = Group
        fields = ['name','created_by']
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Enter group name'}),
        }